#!/usr/bin/env python3
"""
Monte Carlo simulation of optimized bankroll betting engine.
Validates Phase 1–2 safety hooks: tiered Kelly, multiplier caps, floor scaling,
peak drawdown protection, session management.

Target: $50 starting bankroll, $1 minimum bet, 10,000 hands.
Goal: <5% ruin rate, median growth >25%.

Reference: Blackjack edge model uses 70% of theoretical edge due to human error.
"""

import random
import math
import statistics
from collections import defaultdict

# ── Constants ────────────────────────────────────────────────────────────────
EDGE_PER_TC = 0.005         # 0.5% per true count point (theoretical)
VAR = 1.329                 # Hand variance (including splits/doubles etc)
SIGMA = math.sqrt(VAR)      # Standard deviation
KELLY_FRAC_BASE = 0.5       # Half-Kelly standard

# Edge realization factor: real world ~70% of theoretical due to imperfect play/penetration
EDGE_FACTOR = 0.70

# ── Bankroll tiers (mirror JS implementation) ────────────────────────────────
BANKROLL_TIERS = [
    { 'max': 200,  'kellyFrac': 0.25, 'baseMult': 1.5, 'maxTC': 4,  'floorPct': 0.05 },
    { 'max': 300,  'kellyFrac': 0.25, 'baseMult': 1.5, 'maxTC': 4,  'floorPct': 0.05 },
    { 'max': 500,  'kellyFrac': 0.33, 'baseMult': 2.0, 'maxTC': 5,  'floorPct': 0.03 },
    { 'max': 1000, 'kellyFrac': 0.40, 'baseMult': 2.5, 'maxTC': 6,  'floorPct': 0.02 },
    { 'max': 5000, 'kellyFrac': 0.50, 'baseMult': 3.0, 'maxTC': 7,  'floorPct': 0.01 },
    { 'max': float('inf'), 'kellyFrac': 0.50, 'baseMult': 3.0, 'maxTC': 7, 'floorPct': 0.005 },
]

def get_tier(bankroll):
    for t in BANKROLL_TIERS:
        if bankroll <= t['max']:
            return t
    return BANKROLL_TIERS[-1]

def get_bet_floor(bankroll, bet_unit):
    t = get_tier(bankroll)
    floor_dollars = bankroll * t['floorPct']
    return max(1, math.ceil(floor_dollars / bet_unit))

# ── Session configuration ───────────────────────────────────────────────────
SESSION_CONFIG = {
    'stopLossPercent': 0.30,
    'winGoalPercent': 0.50,
    'maxHands': 200
}

# ── True Count sampling distribution (discrete empirical) ────────────────────
# Frequencies derived from typical 8-deck Hi-Lo shoe with 75% penetration.
# Covers negative to positive counts.
TC_DISTRIBUTION = [
    (-3, 0.08), (-2, 0.12), (-1, 0.18), (0, 0.20),
    (+1, 0.15), (+2, 0.12), (+3, 0.08), (+4, 0.05),
    (+5, 0.015), (+6, 0.010), (+7, 0.004), (+8, 0.001)
]
TC_VALUES = [tc for tc, _ in TC_DISTRIBUTION]
TC_WEIGHTS = [w for _, w in TC_DISTRIBUTION]

def sample_tc():
    return random.choices(TC_VALUES, weights=TC_WEIGHTS, k=1)[0]

# ── Heat simulation guard ────────────────────────────────────────────────────
def apply_heat_safety(units, tc, bankroll, bet_unit, enabled):
    if not enabled or bankroll < 200 or tc < 2:
        return units, 'Cool (skipped)'
    heat_factor = max(0.5, min(2.0, 1 + (1 - abs(tc / 5))))
    variance = 0.7 + random.random() * 0.6  # 0.7–1.3
    total_factor = heat_factor * variance
    projected_units = units * total_factor
    risk_cap_units = math.floor(bankroll * 0.15 / bet_unit)
    if projected_units > risk_cap_units:
        return min(units, risk_cap_units), 'Warm (risk-capped)'
    return projected_units, f"{'Hot' if heat_factor>0.95 else 'Warm' if heat_factor>0.8 else 'Cool'}"

# ── Peak-reference drawdown protection ───────────────────────────────────────
def peak_adjustment(raw_units, current_br, peak_br):
    if current_br >= peak_br * 0.95:
        return raw_units
    drawdown = (peak_br - current_br) / peak_br
    penalty = max(0.5, 1 - drawdown * 1.5)
    return raw_units * penalty

# ── Core betting engine (mirrors optimized strategy.js) ───────────────────────
def compute_bet(bankroll, bet_unit, tc, peak_br=None, use_kelly=True, index_system='Hi-Lo',
                mikki_multiplier=3.0, use_heat=False, ra=0.0, ace_tc=0.0):
    """Return finalUnits, betDollar, metadata."""
    # Edge calculation
    raw_edge = EDGE_PER_TC * max(0, tc)
    ra_bonus = EDGE_PER_TC * 0.5 * max(0, -ra)  # RA_FACTOR=0.5
    ace_bonus = 0.005 * ace_tc
    edge = (raw_edge + ra_bonus + ace_bonus) * EDGE_FACTOR

    tier = get_tier(bankroll)

    # Base units
    if use_kelly:
        kelly_frac = tier['kellyFrac']
        units = (edge / VAR) * kelly_frac * (bankroll / bet_unit)
    elif index_system == 'Omega II':
        # Simplified Omega ramp implementation
        if tc <= 0: units = 1
        elif tc < 2: units = 2
        elif tc < 3: units = 4
        elif tc < 4: units = 6
        elif tc < 5: units = 8
        else: units = 12
    else:
        # Mikki multiplier with cap
        raw = 1 if tc <= 0 else tier['baseMult'] * tc + 1
        cap = tier['maxTC'] * tier['baseMult'] + 1
        units = min(raw, cap)

    # RA multiplier
    ra_mult = 0.80 if ra > 0.5 else (1.20 if ra < -0.5 else 1.0)
    units *= ra_mult

    # Bankroll-tiered minimum bet floor — only when count is favorable
    # On negative/neutral counts, bet table minimum (Wong-out equivalent)
    if tc > 0:
        floor_units = get_bet_floor(bankroll, bet_unit)
        units = max(units, floor_units)
    else:
        units = max(1, units)

    # Heat simulation
    units, heat_label = apply_heat_safety(units, tc, bankroll, bet_unit, use_heat)

    # Peak drawdown protection
    if peak_br is not None and bankroll < peak_br * 0.95:
        drawdown = (peak_br - bankroll) / peak_br
        penalty = max(0.5, 1 - drawdown * 1.5)
        units *= penalty

    # Clamp
    max_units_br = math.floor(bankroll / bet_unit)
    max_units_risk = math.floor(bankroll * 0.15 / bet_unit)  # never risk >15% per hand
    units = max(1, round(units))
    units = min(units, max_units_br)
    units = min(units, max_units_risk)
    units = min(units, 120)  # hard cap

    return units, units * bet_unit, {'edge': edge, 'heat': heat_label}

# ── Hand outcome approximation ───────────────────────────────────────────────
def sample_hand_outcome(net_edge_per_unit):
    """
    Approximate net outcome for a single hand given edge per unit bet.
    Uses a simplified distribution approximating blackjack's discrete outcomes.
    Returns net win in dollars (not units).
    Model: E[net] = bet * edge, Var(net) = bet^2 * VAR.
    We'll sample from a normal distribution for simplicity.
    """
    # For unit bet:
    #  - push ~ 10-12%  -> net 0
    #  - win 1:1 ~ 42%  -> net +1
    #  - win BJ 3:2 ~ 3% -> net +1.5
    #  - lose ~ 45%      -> net -1
    # But this is coarse; use normal with same moments:
    # mean = edge, variance = VAR (per unit bet)
    sd = math.sqrt(VAR)
    return random.gauss(net_edge_per_unit, sd)

# ── Session management ───────────────────────────────────────────────────────
class Session:
    def __init__(self, total_br, fraction=1.0):
        self.active = True
        self.start_br = total_br * fraction
        self.bankroll = self.start_br
        self.hands_played = 0
        self.high_water = self.start_br
        self.exit_reason = None

    def update(self, net_win):
        self.hands_played += 1
        self.bankroll += net_win
        # Stop-loss
        loss_thresh = self.high_water * (1 - SESSION_CONFIG['stopLossPercent'])
        if self.bankroll <= loss_thresh:
            self.active = False
            self.exit_reason = 'STOP_LOSS'
            return False
        # Win-goal
        win_target = self.start_br * (1 + SESSION_CONFIG['winGoalPercent'])
        if self.bankroll >= win_target:
            self.active = False
            self.exit_reason = 'WIN_GOAL'
            return False
        # Max hands
        if self.hands_played >= SESSION_CONFIG['maxHands']:
            self.active = False
            self.exit_reason = 'MAX_HANDS'
            return False
        self.high_water = max(self.high_water, self.bankroll)
        return True

# ── Simulation driver ───────────────────────────────────────────────────────
def simulate(start_br=50, bet_unit=1, n_hands=10000, use_session=True,
             use_kelly=True, use_heat=False, seed=None):
    if seed is not None:
        random.seed(seed)

    br = start_br
    peak = br
    session = Session(br, 1.0) if use_session else None

    history = []
    for h in range(n_hands):
        if br <= 0:
            history.append({'hand': h+1, 'br': 0, 'ruined': True})
            break

        # Sample true count
        tc = sample_tc()

        # Compute bet
        units, bet, meta = compute_bet(
            bankroll=br,
            bet_unit=bet_unit,
            tc=tc,
            peak_br=peak,
            use_kelly=use_kelly,
            mikki_multiplier=3.0,
            use_heat=use_heat,
            ra=random.uniform(-0.3, 0.3),   # simplified RA random
            ace_tc=random.uniform(-1, 1)     # simplified ace TC
        )

        # Net outcome: edge per unit * units + variance shock
        edge_per_unit = meta['edge']
        # Scale by units since edge is per unit bet
        expected_net = edge_per_unit * bet
        # Sample actual net (includes variance)
        # Approximate: net_hand ~ N(mean=expected_net, sd = bet * SIGMA)
        net = random.gauss(expected_net, bet * SIGMA)

        br += net
        peak = max(peak, br)

        # Session tracking
        session_net = net
        if session and session.active:
            cont = session.update(session_net)
            if not cont:
                # Session ended (stop-loss or win-goal) — disciplined exit
                break

        history.append({
            'hand': h+1,
            'tc': tc,
            'units': units,
            'bet': bet,
            'edge': edge_per_unit,
            'net': net,
            'br': br,
            'peak': peak,
            'session_active': session.active if session else None,
            'session_reason': session.exit_reason if session else None,
            'drawdown': (peak - br) / peak if peak > 0 else 0
        })

        if br <= 0:
            break

    return history

# ── Aggregate statistics ─────────────────────────────────────────────────────
def analyze(history, start_br):
    final_br = history[-1]['br']
    ruined = final_br <= 0
    max_drawdown = max(h['drawdown'] for h in history)
    hands_played = len(history)

    # Growth metrics
    total_return = (final_br - start_br) / start_br if start_br > 0 else 0

    # Session outcomes
    session_ends = [h for h in history if h.get('session_reason')]
    stop_loss_count = sum(1 for h in session_ends if h['session_reason'] == 'STOP_LOSS')
    win_goal_count = sum(1 for h in session_ends if h['session_reason'] == 'WIN_GOAL')

    # Bet distribution
    bets = [h['bet'] for h in history]
    avg_bet_pct = statistics.mean(b / start_br for b in bets) if bets else 0

    return {
        'final_br': final_br,
        'ruined': ruined,
        'hands': hands_played,
        'total_return': total_return,
        'max_drawdown': max_drawdown,
        'avg_bet_pct_of_br': avg_bet_pct,
        'stop_loss_sessions': stop_loss_count,
        'win_goal_sessions': win_goal_count,
        'peak': history[-1]['peak'],
    }

# ── Main ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    N_SIM = 2000
    MAX_HANDS = 3000
    SEED = 42  # reproducibility

    print(f"=== Monte Carlo Simulation: {N_SIM} shoes, $50 → optimized betting ===\n")

    results = []
    for i in range(N_SIM):
        hist = simulate(start_br=50, bet_unit=1, n_hands=MAX_HANDS,
                        use_session=True, use_kelly=True, use_heat=False, seed=SEED+i)
        stats = analyze(hist, 50)
        results.append(stats)

    # Aggregate
    ruined = sum(1 for r in results if r['ruined'])
    returns = [r['total_return'] for r in results]
    median_return = statistics.median(returns)
    draws = [r['max_drawdown'] for r in results]
    median_draw = statistics.median(draws)
    avg_hands = statistics.mean(r['hands'] for r in results)
    avg_sl = statistics.mean(r['stop_loss_sessions'] for r in results)
    avg_wg = statistics.mean(r['win_goal_sessions'] for r in results)

    print(f"Ruin rate:        {ruined}/{N_SIM} = {ruined/N_SIM*100:.2f}%")
    print(f"Median return:    {median_return*100:.1f}%")
    print(f"Median max draw:  {median_draw*100:.1f}%")
    print(f"Avg hands played: {avg_hands:.0f}")
    print(f"Avg stop-loss hits per sim: {avg_sl:.2f}")
    print(f"Avg win-goal hits per sim:  {avg_wg:.2f}")
    print(f"\nNote: Target <5% ruin, >25% median return — achieved?")
    print(f"  → {'✅ PASS' if ruined/N_SIM < 0.05 else '❌ FAIL'} (ruin {ruined/N_SIM*100:.2f}% vs target <5%)")
    print(f"  → {'✅ PASS' if median_return > 0.25 else '❌ FAIL'} (median growth {median_return*100:.1f}% vs target >25%)")
