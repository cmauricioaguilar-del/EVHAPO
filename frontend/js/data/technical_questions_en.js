// ─── English Technical Question Categories ────────────────────────────────────
// Same keys, ids, values and points as ES version — score compatibility preserved.

const TECHNICAL_CATEGORIES_EN = [
  {
    key: 'rangos_preflop',
    label: 'Pre-Flop Ranges',
    icon: '🃏',
    color: '#1565C0',
    description: 'Knowledge of opening ranges, 3-bet, 4-bet and calling ranges by position and number of players.',
    questions: [
      {
        id: 201,
        text: 'At a 9-player table, from which position should your opening range be the TIGHTEST?',
        options: [
          { label: 'UTG (Under the Gun)', value: 'a', points: 10 },
          { label: 'CO (Cut-Off)', value: 'b', points: 0 },
          { label: 'BTN (Button)', value: 'c', points: 0 },
          { label: 'SB (Small Blind)', value: 'd', points: 0 },
        ],
      },
      {
        id: 202,
        text: 'You have ATo in CO. HJ opens to 3BB, everyone folds. What is the most balanced (GTO) action?',
        options: [
          { label: '3-bet or fold — ATo is not a cold call hand from CO', value: 'a', points: 10 },
          { label: 'Always call — ATo is too strong to fold', value: 'b', points: 0 },
          { label: 'Always fold — ATo is too weak facing a HJ open', value: 'c', points: 0 },
          { label: 'Always raise to 9BB — we have positional advantage', value: 'd', points: 0 },
        ],
      },
      {
        id: 203,
        text: 'What are "blockers" and how are they used in 3-bet bluff decisions?',
        options: [
          { label: 'Cards that reduce the probability of the opponent holding strong hands in that range', value: 'a', points: 10 },
          { label: 'Hands that block the pot to avoid paying too much', value: 'b', points: 0 },
          { label: 'Defensive plays to prevent the opponent from raising', value: 'c', points: 0 },
          { label: 'Positions that "block" other players from entering the hand', value: 'd', points: 0 },
        ],
      },
      {
        id: 204,
        text: 'You have KQo on BTN. UTG opens 3BB, everyone folds. What is the correct action?',
        options: [
          { label: '3-bet or fold depending on villain tendencies — KQo is marginal vs UTG', value: 'a', points: 10 },
          { label: 'Always call — KQo plays well in position', value: 'b', points: 0 },
          { label: 'Always raise — KQo dominates UTG\'s range', value: 'c', points: 0 },
          { label: 'Always fold — KQo has no value facing UTG', value: 'd', points: 0 },
        ],
      },
      {
        id: 205,
        text: 'What does "cold call" mean pre-flop?',
        options: [
          { label: 'Calling a raise without having previously invested chips in the pot', value: 'a', points: 10 },
          { label: 'Calling with a very strong hand to disguise it', value: 'b', points: 0 },
          { label: 'Calling in the big blind when there is no raise', value: 'c', points: 0 },
          { label: 'Calling from the small blind', value: 'd', points: 0 },
        ],
      },
      {
        id: 206,
        text: 'When is it correct to 4-bet as a bluff?',
        options: [
          { label: 'With hands that have good blockers (e.g. A5s, A4s) and little equity if called', value: 'a', points: 10 },
          { label: 'Whenever we have a middle pair or better', value: 'b', points: 0 },
          { label: 'When out of position and we want to win the pot pre-flop', value: 'c', points: 0 },
          { label: 'Only with nut hands like AA or KK to maximize value', value: 'd', points: 0 },
        ],
      },
      {
        id: 207,
        text: 'At a 6-player table (6-max), the BTN opening range should be approximately:',
        options: [
          { label: '40–50% of hands — BTN is the most advantageous position', value: 'a', points: 10 },
          { label: '15–20% of hands — always be selective', value: 'b', points: 0 },
          { label: '70–80% of hands — from BTN you can open almost anything', value: 'c', points: 0 },
          { label: 'Premium hands only (AA, KK, QQ, AK) — the risk is too high', value: 'd', points: 0 },
        ],
      },
      {
        id: 208,
        text: 'What advantage does the BB have when defending against a BTN open?',
        options: [
          { label: 'Already has 1BB invested, so the call price is lower and can defend wider', value: 'a', points: 10 },
          { label: 'The BB always has positional advantage over the BTN', value: 'b', points: 0 },
          { label: 'The BB can squeeze with any hand because of position', value: 'c', points: 0 },
          { label: 'No advantage at all — the BTN always dominates the BB', value: 'd', points: 0 },
        ],
      },
    ],
    tips: [
      'Study opening ranges by position using solvers like GTO Wizard or range training apps.',
      'Start by memorising BTN, CO and BB ranges — they account for the highest hand volume.',
      'Understand the difference between RFI (raise first in), 3-bet and cold call before memorising ranges.',
      'Practice range quizzes daily: 10 minutes a day makes a big difference over weeks.',
      'Ranges vary by game type (6-max, 9-max) and opponent tendencies.',
    ],
  },

  {
    key: 'juego_ip',
    label: 'In-Position Play (IP)',
    icon: '🎯',
    color: '#00695C',
    description: 'Understanding positional advantages, game lines and strategies when acting after the opponent.',
    questions: [
      {
        id: 209,
        text: 'What is the main tactical advantage of playing in position (IP)?',
        options: [
          { label: 'Acting last allows decisions to be made with more information about the opponent\'s hand', value: 'a', points: 10 },
          { label: 'You can bet larger because the opponent cannot see you', value: 'b', points: 0 },
          { label: 'You have access to more winning hands when in position', value: 'c', points: 0 },
          { label: 'You can bluff more because the opponent does not expect a bet', value: 'd', points: 0 },
        ],
      },
      {
        id: 210,
        text: 'You are BTN; the BB checks on an A-7-2 rainbow flop. What is the most balanced strategy?',
        options: [
          { label: 'Bet frequently with a small size (25–33% pot) — this board heavily favours the BTN', value: 'a', points: 10 },
          { label: 'Always check back to avoid risk — the opponent may have the Ace', value: 'b', points: 0 },
          { label: 'Bet large (75% pot) with your entire range to apply pressure', value: 'c', points: 0 },
          { label: 'Only bet if you hold the Ace or better — everything else is dangerous', value: 'd', points: 0 },
        ],
      },
      {
        id: 211,
        text: 'What is a "delayed c-bet"?',
        options: [
          { label: 'Checking back the flop in position and betting the turn when the opponent also checks', value: 'a', points: 10 },
          { label: 'Making a c-bet on the flop then reducing size on the turn', value: 'b', points: 0 },
          { label: 'Waiting until the river to make the first bet', value: 'c', points: 0 },
          { label: 'Raising the opponent\'s turn bet after calling on the flop', value: 'd', points: 0 },
        ],
      },
      {
        id: 212,
        text: 'You have KK in position. The flop comes J-T-9 with two suits. The opponent bets 2/3 pot. What is the best action?',
        options: [
          { label: 'Call — we have a strong hand but the board is very wet and risky to raise', value: 'a', points: 10 },
          { label: 'Always fold — KK without a set is too weak on this board', value: 'b', points: 0 },
          { label: 'Immediately shove all-in — KK is very strong', value: 'c', points: 0 },
          { label: 'Small raise to "probe" the opponent\'s strength', value: 'd', points: 0 },
        ],
      },
      {
        id: 213,
        text: 'When is it most correct to check back (check in position) on the flop?',
        options: [
          { label: 'With middle pair hands or weak draws to control the pot and reach the turn', value: 'a', points: 10 },
          { label: 'Never — always bet in position to exploit the advantage', value: 'b', points: 0 },
          { label: 'Only when you hold the strongest possible hand (nuts)', value: 'c', points: 0 },
          { label: 'Whenever the opponent showed weakness before the flop', value: 'd', points: 0 },
        ],
      },
      {
        id: 214,
        text: 'You are BTN vs SB. The SB check-raises on the flop. What does this line generally indicate?',
        options: [
          { label: 'A strong hand (set, two pair) or a very powerful draw — the SB is protecting their range', value: 'a', points: 10 },
          { label: 'Always a bluff — nobody has something real that quickly', value: 'b', points: 0 },
          { label: 'A weak hand trying to steal the pot before the turn', value: 'c', points: 0 },
          { label: 'Only indicates the SB has the Ace and wants value', value: 'd', points: 0 },
        ],
      },
      {
        id: 215,
        text: 'In position, your opponent checks the turn after check-calling the flop. You have complete air. When should you bet?',
        options: [
          { label: 'When the turn is a scare card for the opponent and you have fold equity', value: 'a', points: 10 },
          { label: 'Always — if they checked twice they have a weak hand', value: 'b', points: 0 },
          { label: 'Never — with air you do not bet twice in a row', value: 'c', points: 0 },
          { label: 'Only if the pot is small and the risk is low', value: 'd', points: 0 },
        ],
      },
      {
        id: 216,
        text: 'What is a "probe bet" and when is it used?',
        options: [
          { label: 'A bet by the OOP player on the turn when the IP player checked back the flop', value: 'a', points: 10 },
          { label: 'A small bet to see if the opponent "reacts" with information', value: 'b', points: 0 },
          { label: 'An overbet on the river to maximise value with the nuts', value: 'c', points: 0 },
          { label: 'The first bet made by the pre-flop raiser on the flop', value: 'd', points: 0 },
        ],
      },
    ],
    tips: [
      'Make the most of the button: at 6-max tables you can open up to 45–50% of hands from BTN.',
      'Learn to identify "range advantage": which boards favour your range vs the opponent\'s.',
      'Practice the delayed c-bet: it is a very powerful tool underused by intermediate players.',
      'In position you don\'t always need to bet — strategic check-backs protect your range.',
      'Study optimal bet sizes by board type: dry A-high boards are very different from wet J-T-9 boards.',
    ],
  },

  {
    key: 'juego_oop',
    label: 'Out-of-Position Play (OOP)',
    icon: '🛡️',
    color: '#6A1B9A',
    description: 'Strategies and game lines when acting before the opponent, including check-raise, donk bet and range management.',
    questions: [
      {
        id: 217,
        text: 'What is the main challenge of playing out of position (OOP)?',
        options: [
          { label: 'Acting first limits available information and forces you to reveal hand strength earlier', value: 'a', points: 10 },
          { label: 'Out of position you can only play premium hands', value: 'b', points: 0 },
          { label: 'You cannot bluff because the opponent always knows you have air', value: 'c', points: 0 },
          { label: 'Bets cost more when you are OOP', value: 'd', points: 0 },
        ],
      },
      {
        id: 218,
        text: 'From the BB you called the BTN\'s open. The flop comes K-8-2 rainbow. What is the most balanced strategy?',
        options: [
          { label: 'Check most of your range — the BTN has a range advantage on this high flop', value: 'a', points: 10 },
          { label: 'Always bet with any hand to show strength', value: 'b', points: 0 },
          { label: 'Fold if you don\'t have the King — the risk is too high', value: 'c', points: 0 },
          { label: 'Check-raise with your entire range to balance', value: 'd', points: 0 },
        ],
      },
      {
        id: 219,
        text: 'What is a "donk bet"?',
        options: [
          { label: 'Betting out of position on the flop when the opponent was the pre-flop raiser (PFR)', value: 'a', points: 10 },
          { label: 'A very large bet made without strategic purpose', value: 'b', points: 0 },
          { label: 'A minimum bet to see if the opponent raises', value: 'c', points: 0 },
          { label: 'The first bet made by the in-position player on the flop', value: 'd', points: 0 },
        ],
      },
      {
        id: 220,
        text: 'OOP, the flop comes 6-6-9 rainbow. The opponent opened from CO. Which range benefits from a donk bet?',
        options: [
          { label: 'Hands containing a 6 (trips), nines, and some draws — paired boards favour the caller', value: 'a', points: 10 },
          { label: 'Only total bluffs to confuse the opponent', value: 'b', points: 0 },
          { label: 'Never donk on paired boards — it is a very advanced play', value: 'c', points: 0 },
          { label: 'Only the strongest possible hand to maximise value', value: 'd', points: 0 },
        ],
      },
      {
        id: 221,
        text: 'What does "polarising your range" mean when betting OOP?',
        options: [
          { label: 'Betting with very strong hands (value) or very weak hands (bluff), removing the middle', value: 'a', points: 10 },
          { label: 'Splitting your range exactly 50/50 between calls and raises', value: 'b', points: 0 },
          { label: 'Playing all hands the same way to avoid giving information', value: 'c', points: 0 },
          { label: 'Using different bet sizes depending on the opponent\'s position', value: 'd', points: 0 },
        ],
      },
      {
        id: 222,
        text: 'You have A5s OOP. The flop comes J-T-4 with two cards of your suit (flush draw + gutshot). What do you do?',
        options: [
          { label: 'Check-raise — you have a lot of equity and this is an excellent semi-bluff hand', value: 'a', points: 10 },
          { label: 'Fold — draws out of position are not worth it', value: 'b', points: 0 },
          { label: 'Always call — A5s is too weak to raise', value: 'c', points: 0 },
          { label: 'Bet small to "protect" your draw', value: 'd', points: 0 },
        ],
      },
      {
        id: 223,
        text: 'Why is having "nut advantage" important when playing OOP?',
        options: [
          { label: 'Having the best possible hands lets you defend your range better and bet more frequently', value: 'a', points: 10 },
          { label: 'Nut advantage only matters on the river, not when playing OOP', value: 'b', points: 0 },
          { label: 'Nut advantage has no real importance in the modern game', value: 'c', points: 0 },
          { label: 'It only matters in tournaments, not in cash games', value: 'd', points: 0 },
        ],
      },
      {
        id: 224,
        text: 'Check-raising OOP on a dry flop (A-7-2 rainbow). Which range correctly represents this play?',
        options: [
          { label: 'Sets, two pairs and some bluffs with good equity — the range is very polarised', value: 'a', points: 10 },
          { label: 'Only bluffs — nobody check-raises with strong hands on dry flops', value: 'b', points: 0 },
          { label: 'Always indicates the Ace with a strong kicker', value: 'c', points: 0 },
          { label: 'It is a play with no strategic purpose on dry flops', value: 'd', points: 0 },
        ],
      },
    ],
    tips: [
      'Learn the concepts of "range advantage" and "nut advantage" — they are key to deciding when to bet OOP.',
      'The check-raise is your main weapon OOP: use it with strong draws and value hands to stay balanced.',
      'Study on which boards a donk bet makes sense and on which you should simply check.',
      'OOP you must be more selective with the hands you play — the positional disadvantage has a real cost.',
      'Practice identifying whether you have "range advantage" or "nut advantage" before every OOP decision.',
    ],
  },

  {
    key: 'textura_flop',
    label: 'Flop Texture',
    icon: '🎴',
    color: '#E65100',
    description: 'Board analysis on the flop: classification by wetness, coordination, range advantage and optimal bet sizes.',
    questions: [
      {
        id: 225,
        text: 'What is a "monotone" flop?',
        options: [
          { label: 'A flop where all three cards are the same suit', value: 'a', points: 10 },
          { label: 'A flop with no draw possibilities', value: 'b', points: 0 },
          { label: 'A flop with three consecutive cards of the same value', value: 'c', points: 0 },
          { label: 'A flop with exactly one card of each suit', value: 'd', points: 0 },
        ],
      },
      {
        id: 226,
        text: 'Flop: A♥-7♦-2♣ (rainbow, no draws). How would you classify this board?',
        options: [
          { label: 'Dry and static — few hands change value on the turn or river', value: 'a', points: 10 },
          { label: 'Wet and dynamic — many possible draws', value: 'b', points: 0 },
          { label: 'Connected — obvious straight draws are present', value: 'c', points: 0 },
          { label: 'Paired — the Ace doubles the possibilities', value: 'd', points: 0 },
        ],
      },
      {
        id: 227,
        text: 'Flop: J♣-T♣-9♥. What is the main strategic impact of this board?',
        options: [
          { label: 'Very dynamic — many flush and straight draws change hand value on every street', value: 'a', points: 10 },
          { label: 'Only the player with the Jack dominates the board', value: 'b', points: 0 },
          { label: 'It is a static board where bluffing is useless', value: 'c', points: 0 },
          { label: 'Only benefits very strong hands like sets or made straights', value: 'd', points: 0 },
        ],
      },
      {
        id: 228,
        text: 'In general, who benefits more from low connected flops (e.g. 6-5-4)?',
        options: [
          { label: 'The pre-flop caller — has more connected hands in their range', value: 'a', points: 10 },
          { label: 'The pre-flop raiser (PFR) — always has the range advantage', value: 'b', points: 0 },
          { label: 'The BTN regardless of whether they opened or called', value: 'c', points: 0 },
          { label: 'Neither — these boards are always neutral for both players', value: 'd', points: 0 },
        ],
      },
      {
        id: 229,
        text: 'On a Q-J-5 flop with two suits (semi-wet), what c-bet size is most balanced for the PFR?',
        options: [
          { label: '33–50% of the pot — medium size balances value and protection', value: 'a', points: 10 },
          { label: 'Always overbet (+100%) to pressure draws', value: 'b', points: 0 },
          { label: 'Always min-bet to preserve chips', value: 'c', points: 0 },
          { label: 'Never bet on semi-wet flops — too dangerous', value: 'd', points: 0 },
        ],
      },
      {
        id: 230,
        text: 'What is a "paired" flop and how does it affect strategy?',
        options: [
          { label: 'A flop with two cards of the same value (e.g. A-A-7) — benefits the PFR\'s range and complicates draws', value: 'a', points: 10 },
          { label: 'A flop where both players have a pair — the pot is split', value: 'b', points: 0 },
          { label: 'A board where there are exactly two different suits', value: 'c', points: 0 },
          { label: 'A board that always favours the OOP player', value: 'd', points: 0 },
        ],
      },
      {
        id: 231,
        text: 'Flop: K♠-K♦-2♣. Who typically holds the range advantage on this board?',
        options: [
          { label: 'The PFR (pre-flop opener) — has more Kx combos in their opening range', value: 'a', points: 10 },
          { label: 'Always the BB — has access to any K at a good price', value: 'b', points: 0 },
          { label: 'Always the in-position player regardless of range', value: 'c', points: 0 },
          { label: 'Neither — paired boards are always neutral', value: 'd', points: 0 },
        ],
      },
      {
        id: 232,
        text: 'On a very wet flop (many flush and straight draw possibilities), what is the most correct strategy?',
        options: [
          { label: 'Bet large with value hands to deny equity to draws and protect the hand', value: 'a', points: 10 },
          { label: 'Always check — wet boards are too dangerous', value: 'b', points: 0 },
          { label: 'Bet small to avoid losing too many chips if the opponent has a draw', value: 'c', points: 0 },
          { label: 'Go all-in immediately with any pair to maximise fold equity', value: 'd', points: 0 },
        ],
      },
    ],
    tips: [
      'Learn to classify each board before deciding: is it dry or wet? Static or dynamic?',
      'Study how each board interacts with the opening ranges of each position.',
      'Flop bet size should reflect board wetness: dry boards → small bets; wet boards → larger bets.',
      'Practice identifying who has "range advantage" on each flop based on the positions in the hand.',
      'Use solvers to see how top players bet on different board types.',
    ],
  },

  {
    key: 'lineas_turn',
    label: 'Turn: Game Lines',
    icon: '↩️',
    color: '#558B2F',
    description: 'Turn strategies: double barrel, check-raise, scare cards, pot control and equity management on the second post-flop street.',
    questions: [
      {
        id: 233,
        text: 'What is the "double barrel" on the turn?',
        options: [
          { label: 'Betting a second consecutive time on the turn after having bet on the flop', value: 'a', points: 10 },
          { label: 'Raising the opponent\'s bet size twice on the flop', value: 'b', points: 0 },
          { label: 'C-betting the flop and then check-raising the turn', value: 'c', points: 0 },
          { label: 'Betting the river with two outs or fewer', value: 'd', points: 0 },
        ],
      },
      {
        id: 234,
        text: 'You c-bet the flop and got called. The turn is a blank card (no new draws). When should you continue betting?',
        options: [
          { label: 'With strong value hands and bluffs that have equity (draws) or good fold equity', value: 'a', points: 10 },
          { label: 'Always — if you bet the flop you must follow through', value: 'b', points: 0 },
          { label: 'Never — the double barrel is too expensive and predictable', value: 'c', points: 0 },
          { label: 'Only if you have the strongest possible hand on the board', value: 'd', points: 0 },
        ],
      },
      {
        id: 235,
        text: 'What does "picking up equity" mean on the turn?',
        options: [
          { label: 'When a turn card improves your hand or draw, increasing your chances of winning', value: 'a', points: 10 },
          { label: 'Making small bets to build the pot before the river', value: 'b', points: 0 },
          { label: 'Calculating your exact equity with a calculator', value: 'c', points: 0 },
          { label: 'When the opponent checks and you can see the river for free', value: 'd', points: 0 },
        ],
      },
      {
        id: 236,
        text: 'Your opponent check-called the flop and now check-raises the turn. What does this generally indicate?',
        options: [
          { label: 'A very strong hand — turn check-raises are usually for value (set, two pair, straight)', value: 'a', points: 10 },
          { label: 'Always a bluff — nobody has something that strong that quickly', value: 'b', points: 0 },
          { label: 'A weak hand trying to steal the pot before the river', value: 'c', points: 0 },
          { label: 'The opponent has air and wants you to fold before the river', value: 'd', points: 0 },
        ],
      },
      {
        id: 237,
        text: 'What is a "scare card" on the turn and how does it change strategy?',
        options: [
          { label: 'A card that completes possible draws or pairs the board, generating more uncertainty', value: 'a', points: 10 },
          { label: 'A card that always benefits the opponent regardless of their hand', value: 'b', points: 0 },
          { label: 'The Ace when it appears on the turn — always scares whoever doesn\'t have it', value: 'c', points: 0 },
          { label: 'A card that makes neither player want to bet', value: 'd', points: 0 },
        ],
      },
      {
        id: 238,
        text: 'You have a flush draw on the turn with 9 outs. The pot is $100 and the opponent bets $60. Is calling correct?',
        options: [
          { label: 'Yes — you have approx. 18% equity on the turn; the call price ($60/$160=37.5%) is not enough, but you can call if implied odds are favourable', value: 'a', points: 10 },
          { label: 'Yes always — flush draws are always worth calling', value: 'b', points: 0 },
          { label: 'Never — draws never justify the call', value: 'c', points: 0 },
          { label: 'Only if the opponent is very aggressive and always bluffing', value: 'd', points: 0 },
        ],
      },
      {
        id: 239,
        text: 'When is it optimal to check-raise the turn while OOP?',
        options: [
          { label: 'With very strong hands or high-equity semi-bluffs to protect your range and gain value', value: 'a', points: 10 },
          { label: 'Only when you have complete air to steal the pot', value: 'b', points: 0 },
          { label: 'Whenever the opponent bet the flop — it is a sign of weakness', value: 'c', points: 0 },
          { label: 'Never — turn check-raises are only for advanced players', value: 'd', points: 0 },
        ],
      },
      {
        id: 240,
        text: 'You bet the flop and checked the turn. Your opponent bets. You have top pair with a weak kicker. What do you do?',
        options: [
          { label: 'Depends on sizing and opponent — generally call to reach the river and re-evaluate', value: 'a', points: 10 },
          { label: 'Always fold — if you checked the turn you have a weak hand', value: 'b', points: 0 },
          { label: 'Always raise to "defend" — show them you have a hand', value: 'c', points: 0 },
          { label: 'Go all-in — top pair is always enough to play for stacks', value: 'd', points: 0 },
        ],
      },
    ],
    tips: [
      'Study the concept of "turn barreling frequencies" — you don\'t always barrel the turn, only with the correct range.',
      'Identify which turn cards improve your range and which improve the opponent\'s range.',
      'Scare cards can be bluffing opportunities — if a card scares the opponent it may help you take the pot.',
      'Turn check-raise is a high-impact play — use it with strong hands and powerful semi-bluffs.',
      'Learn the concepts of "implied odds" and "reverse implied odds" for draw decisions.',
    ],
  },

  {
    key: 'river_value',
    label: 'River: Value Bet & Lines',
    icon: '💰',
    color: '#B71C1C',
    description: 'Final decisions on the river: value bet sizing, bluff identification, reading previous lines and pot management.',
    questions: [
      {
        id: 241,
        text: 'What is a "thin value bet" on the river?',
        options: [
          { label: 'Betting with a marginally winning hand expecting the opponent to call with worse hands', value: 'a', points: 10 },
          { label: 'A small bet to avoid losing too many chips if the opponent has a better hand', value: 'b', points: 0 },
          { label: 'Betting only when you are certain you have the best possible hand', value: 'c', points: 0 },
          { label: 'A value bet the opponent cannot see coming', value: 'd', points: 0 },
        ],
      },
      {
        id: 242,
        text: 'You reach the river with the nut hand (best possible hand). The pot is $200. What value bet size is generally most correct?',
        options: [
          { label: 'Depends on opponent\'s range — if they call big, overbet or 75–100% pot', value: 'a', points: 10 },
          { label: 'Always minimum bet to ensure you get called', value: 'b', points: 0 },
          { label: 'Always all-in — with the best hand always maximise', value: 'c', points: 0 },
          { label: 'Don\'t bet — the opponent will fold if you bet with the nuts', value: 'd', points: 0 },
        ],
      },
      {
        id: 243,
        text: 'When is it correct to bluff on the river?',
        options: [
          { label: 'When you have sufficient fold equity, a coherent betting story and the opponent can fold strong hands', value: 'a', points: 10 },
          { label: 'Whenever you have lost a lot in the session — you need to recover', value: 'b', points: 0 },
          { label: 'Only when you have total air and never connected', value: 'c', points: 0 },
          { label: 'Never — river bluffing is always a mistake', value: 'd', points: 0 },
        ],
      },
      {
        id: 244,
        text: 'The river arrives and you have second pair. Your opponent bets 75% of the pot. What does their line indicate?',
        options: [
          { label: 'A very polarised range — strong hand (nuts) or desperate bluff; rarely a medium hand', value: 'a', points: 10 },
          { label: 'Always a bluff — nobody bets big with a real hand on the river', value: 'b', points: 0 },
          { label: 'They have exactly second pair like you — they want to chop the pot', value: 'c', points: 0 },
          { label: 'We cannot know anything — the river is always random', value: 'd', points: 0 },
        ],
      },
      {
        id: 245,
        text: 'You have KK on an Ace-high board (A-8-4-2-7). Flop and turn were passive. What is your river line?',
        options: [
          { label: 'Medium or thin value bet — KK may be good but we cannot bet large with fear of the Ace', value: 'a', points: 10 },
          { label: 'Always check-fold — KK without a set on an Ace board is a losing hand', value: 'b', points: 0 },
          { label: 'Always all-in — KK is too strong to be cautious', value: 'c', points: 0 },
          { label: 'Fold to any bet — the Ace is always out there', value: 'd', points: 0 },
        ],
      },
      {
        id: 246,
        text: 'What is "pot control" and when does it apply on the river?',
        options: [
          { label: 'A strategy of keeping the pot small with medium hands to avoid difficult situations', value: 'a', points: 10 },
          { label: 'Calculating the exact pot size to decide whether to bet', value: 'b', points: 0 },
          { label: 'Controlling emotions when the pot is very large', value: 'c', points: 0 },
          { label: 'A technique to prevent the opponent from raising on the river', value: 'd', points: 0 },
        ],
      },
      {
        id: 247,
        text: 'Your opponent was passive on flop and turn and suddenly makes an overbet (more than 100% pot) on the river. What does this indicate?',
        options: [
          { label: 'A very polarised range — very strong hand (nuts) or desperate bluff; rarely a medium hand', value: 'a', points: 10 },
          { label: 'Always has the best hand — the overbet signals nuts', value: 'b', points: 0 },
          { label: 'Always bluffing — the overbet signals desperation', value: 'c', points: 0 },
          { label: 'It has no meaning — river sizing is random', value: 'd', points: 0 },
        ],
      },
      {
        id: 248,
        text: 'What does "blocker bet" mean on the river?',
        options: [
          { label: 'A small OOP bet to control pot size and avoid a large bet from the opponent', value: 'a', points: 10 },
          { label: 'Betting with cards that block the opponent\'s draws', value: 'b', points: 0 },
          { label: 'A large bluff to force a fold from the opponent', value: 'c', points: 0 },
          { label: 'A value bet the opponent cannot ignore', value: 'd', points: 0 },
        ],
      },
    ],
    tips: [
      'Practice identifying the "polarity" of river bets: does the sizing indicate value or a bluff?',
      'Learn when to thin value bet — it is the skill that most separates intermediate from advanced players.',
      'Pot control on the river is key with medium hands — it protects your range and your stack.',
      'Study coherent "river lines": which hands justify the story you showed on the flop and turn?',
      'Develop the habit of reading the opponent\'s full line before deciding on the river.',
    ],
  },
];
