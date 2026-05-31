const HEX = '0123456789abcdef'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?'

export function randomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length)
  crypto.getRandomValues(buf)
  return buf
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => HEX[b >> 4] + HEX[b & 0xf]).join('')
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function randomHex(byteLength: number): string {
  return bytesToHex(randomBytes(byteLength))
}

export function randomBase64(byteLength: number): string {
  return bytesToBase64(randomBytes(byteLength))
}

export function randomBase64Url(byteLength: number): string {
  return bytesToBase64Url(randomBytes(byteLength))
}

export function randomFromCharset(charset: string, length: number): string {
  const bytes = randomBytes(length)
  const n = charset.length
  let out = ''
  for (let i = 0; i < length; i++) {
    out += charset[bytes[i]! % n]
  }
  return out
}

/** Rejection-free pick when charset size divides 256 poorly — use rejection sampling. */
export function randomSecureString(
  charset: string,
  length: number,
): string {
  const n = charset.length
  const maxUnbiased = 256 - (256 % n)
  let out = ''
  while (out.length < length) {
    const batch = randomBytes(length * 2)
    for (const byte of batch) {
      if (byte >= maxUnbiased) continue
      out += charset[byte % n]!
      if (out.length >= length) break
    }
  }
  return out.slice(0, length)
}

export function entropyBits(byteLength: number): number {
  return byteLength * 8
}

export function uuidV4(): string {
  const b = randomBytes(16)
  b[6] = (b[6]! & 0x0f) | 0x40
  b[8] = (b[8]! & 0x3f) | 0x80
  const h = bytesToHex(b)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** UUID v7 (time-ordered), RFC draft — 48-bit ms timestamp + random. */
export function uuidV7(): string {
  const ts = Date.now()
  const b = randomBytes(10)
  const hex = (n: number, len: number) => n.toString(16).padStart(len, '0')
  const timeHi = hex(ts >>> 16, 4)
  const timeMid = hex(ts & 0xffff, 4)
  const timeLow = hex(((ts & 0xfff) << 4) | 0x7000, 4).slice(-4)
  const randA = hex((b[0]! << 8) | b[1]!, 4)
  const randB =
    hex(0x8000 | ((b[2]! & 0x3f) << 8) | b[3]!, 4).slice(-4) +
    bytesToHex(b.subarray(4))
  return `${timeHi}${timeMid.slice(0, 4)}-${timeMid}-${timeLow}-${randA.slice(0, 4)}-${randB.slice(0, 12)}`
}

const WORDS = [
  'able', 'acid', 'acre', 'aged', 'also', 'apex', 'arch', 'atom', 'aunt', 'auto',
  'away', 'axis', 'bake', 'bald', 'ball', 'band', 'bank', 'barn', 'base', 'bath',
  'beam', 'bear', 'beat', 'been', 'bell', 'belt', 'bend', 'best', 'bias', 'bike',
  'bind', 'bird', 'bite', 'blue', 'blur', 'boat', 'body', 'bold', 'bolt', 'bond',
  'bone', 'book', 'boom', 'boot', 'bore', 'born', 'boss', 'both', 'bowl', 'bulk',
  'burn', 'bush', 'busy', 'cage', 'cake', 'call', 'calm', 'came', 'camp', 'card',
  'care', 'cart', 'case', 'cash', 'cast', 'cave', 'cell', 'chat', 'chip', 'city',
  'clay', 'clip', 'club', 'coal', 'coat', 'code', 'coil', 'coin', 'cold', 'come',
  'cook', 'cool', 'cope', 'copy', 'core', 'corn', 'cost', 'crab', 'crew', 'crop',
  'cube', 'cult', 'curb', 'cure', 'curl', 'cyan', 'dale', 'damp', 'dare', 'dark',
  'dart', 'dash', 'data', 'dawn', 'days', 'dead', 'deaf', 'deal', 'dean', 'dear',
  'debt', 'deck', 'deed', 'deep', 'deer', 'demo', 'deny', 'desk', 'dial', 'dice',
  'diet', 'dirt', 'disc', 'dish', 'disk', 'dive', 'dock', 'does', 'dome', 'done',
  'doom', 'door', 'dose', 'down', 'drag', 'draw', 'drew', 'drop', 'drum', 'dual',
  'duck', 'dull', 'dumb', 'dump', 'dune', 'duty', 'each', 'earn', 'ease', 'east',
  'echo', 'edge', 'edit', 'emit', 'epic', 'even', 'ever', 'evil', 'exam', 'exit',
  'face', 'fact', 'fade', 'fail', 'fair', 'fall', 'farm', 'fast', 'fate', 'fear',
  'feed', 'feel', 'feet', 'fell', 'felt', 'file', 'fill', 'film', 'find', 'fine',
  'fire', 'firm', 'fish', 'five', 'flag', 'flat', 'flew', 'flip', 'flow', 'flux',
  'foam', 'fold', 'folk', 'font', 'food', 'foot', 'ford', 'form', 'fort', 'foul',
  'four', 'free', 'frog', 'from', 'fuel', 'full', 'fund', 'fuse', 'gain', 'game',
  'gang', 'gate', 'gave', 'gear', 'gene', 'gift', 'girl', 'give', 'glad', 'glow',
  'glue', 'goal', 'goat', 'goes', 'gold', 'golf', 'gone', 'good', 'grab', 'gray',
  'grew', 'grid', 'grim', 'grow', 'gulf', 'guru', 'hack', 'hail', 'hair', 'half',
  'hall', 'halt', 'hand', 'hang', 'hard', 'harm', 'hate', 'have', 'hawk', 'haze',
  'head', 'hear', 'heat', 'held', 'help', 'herb', 'hero', 'hide', 'high', 'hill',
  'hint', 'hire', 'hold', 'hole', 'holy', 'home', 'hood', 'hook', 'hope', 'horn',
  'host', 'hour', 'huge', 'hull', 'hunt', 'hurt', 'hush', 'hyde', 'icon', 'idea',
  'idle', 'inch', 'into', 'iron', 'isle', 'item', 'jack', 'jade', 'jail', 'jazz',
  'join', 'joke', 'jump', 'jury', 'just', 'keen', 'keep', 'kept', 'kick', 'kill',
  'kind', 'king', 'kite', 'knee', 'knew', 'knob', 'know', 'lace', 'lack', 'lake',
  'lamp', 'land', 'lane', 'last', 'late', 'lawn', 'lead', 'leaf', 'lean', 'left',
  'lens', 'less', 'liar', 'life', 'lift', 'like', 'lime', 'line', 'link', 'lion',
  'list', 'live', 'load', 'loan', 'lock', 'loft', 'logo', 'lone', 'long', 'look',
  'loop', 'lord', 'lose', 'loss', 'lost', 'loud', 'love', 'luck', 'lump', 'lung',
  'lure', 'lush', 'lynx', 'made', 'mail', 'main', 'make', 'male', 'mall', 'many',
  'maps', 'mark', 'mars', 'mask', 'mass', 'mast', 'mate', 'math', 'maze', 'mead',
  'meal', 'mean', 'meat', 'meet', 'melt', 'memo', 'mend', 'menu', 'mere', 'mesh',
  'mess', 'mild', 'mile', 'milk', 'mill', 'mind', 'mine', 'mint', 'miss', 'mist',
  'mode', 'mold', 'mole', 'monk', 'moon', 'more', 'moss', 'most', 'move', 'much',
  'must', 'myth', 'nail', 'name', 'navy', 'near', 'neck', 'need', 'nest', 'news',
  'next', 'nice', 'nine', 'node', 'none', 'noon', 'norm', 'nose', 'note', 'noun',
  'nova', 'nude', 'numb', 'oath', 'obey', 'odds', 'odor', 'okay', 'once', 'only',
  'onto', 'open', 'opus', 'oral', 'orgy', 'ouch', 'oval', 'oven', 'over', 'owed',
  'pace', 'pack', 'pact', 'page', 'paid', 'pail', 'pain', 'pair', 'pale', 'palm',
  'park', 'part', 'pass', 'past', 'path', 'peak', 'pear', 'peel', 'peer', 'pick',
  'pier', 'pike', 'pile', 'pine', 'pink', 'pipe', 'plan', 'play', 'plot', 'plug',
  'plus', 'poem', 'poet', 'pole', 'poll', 'polo', 'pond', 'pool', 'poor', 'pope',
  'pork', 'port', 'pose', 'post', 'pour', 'pray', 'prey', 'prop', 'prow', 'pull',
  'pulp', 'pump', 'pure', 'push', 'quad', 'quay', 'quit', 'quiz', 'race', 'rack',
  'raft', 'rage', 'raid', 'rail', 'rain', 'rake', 'ramp', 'rang', 'rank', 'rant',
  'rape', 'rare', 'rash', 'rate', 'rave', 'read', 'real', 'ream', 'rear', 'reed',
  'reef', 'rely', 'rent', 'rest', 'rice', 'rich', 'ride', 'rift', 'ring', 'riot',
  'ripe', 'rise', 'risk', 'road', 'roar', 'robe', 'rock', 'role', 'roll', 'roof',
  'room', 'root', 'rope', 'rose', 'ruin', 'rule', 'rush', 'rust', 'safe', 'sage',
  'said', 'sail', 'sake', 'sale', 'salt', 'same', 'sand', 'sane', 'sang', 'sank',
  'save', 'scan', 'scar', 'seal', 'seam', 'seat', 'sect', 'seed', 'seek', 'seem',
  'seen', 'self', 'sell', 'send', 'sent', 'serf', 'sewn', 'shed', 'ship', 'shoe',
  'shop', 'shot', 'show', 'shut', 'sick', 'side', 'sigh', 'sign', 'silk', 'sill',
  'silo', 'sing', 'sink', 'sire', 'site', 'size', 'skin', 'skip', 'slab', 'slam',
  'slap', 'slat', 'slaw', 'sled', 'slew', 'slid', 'slim', 'slip', 'slit', 'slot',
  'slow', 'slug', 'slum', 'snap', 'snow', 'snub', 'snug', 'soak', 'soap', 'soar',
  'sock', 'soda', 'sofa', 'soft', 'soil', 'sold', 'sole', 'solo', 'some', 'song',
  'soon', 'sore', 'sort', 'soul', 'soup', 'sour', 'span', 'spar', 'spec', 'sped',
  'spin', 'spit', 'spot', 'spur', 'stab', 'stag', 'star', 'stay', 'stem', 'step',
  'stew', 'stir', 'stop', 'stow', 'stub', 'stud', 'stun', 'such', 'suit', 'sulk',
  'sumo', 'sung', 'sunk', 'sure', 'surf', 'swan', 'sway', 'swim', 'sync', 'tact',
  'tail', 'take', 'tale', 'talk', 'tall', 'tank', 'tape', 'tart', 'task', 'taxi',
  'team', 'tear', 'tech', 'tell', 'tend', 'tent', 'term', 'test', 'text', 'than',
  'that', 'them', 'then', 'they', 'thin', 'this', 'thorn', 'thou', 'thud', 'thug',
  'tick', 'tide', 'tidy', 'tied', 'tier', 'tile', 'till', 'tilt', 'time', 'tiny',
  'tipi', 'tire', 'toad', 'told', 'toll', 'tomb', 'tone', 'took', 'tool', 'tops',
  'tore', 'torn', 'toss', 'tour', 'town', 'trap', 'tray', 'tree', 'trek', 'trim',
  'trio', 'trip', 'trod', 'trot', 'true', 'tube', 'tuck', 'tuft', 'tuna', 'tune',
  'turf', 'turn', 'tusk', 'twin', 'type', 'ugly', 'undo', 'unit', 'unto', 'upon',
  'urge', 'used', 'user', 'vain', 'vale', 'vane', 'vary', 'vase', 'vast', 'veal',
  'veer', 'veil', 'vein', 'vent', 'verb', 'very', 'vest', 'veto', 'vice', 'view',
  'vine', 'visa', 'vise', 'void', 'volt', 'vote', 'wade', 'wage', 'wail', 'wait',
  'wake', 'walk', 'wall', 'wand', 'want', 'ward', 'warm', 'warn', 'warp', 'wash',
  'wasp', 'wave', 'wavy', 'waxy', 'ways', 'weak', 'wear', 'weed', 'week', 'weep',
  'well', 'went', 'were', 'west', 'what', 'when', 'whip', 'whom', 'wick', 'wide',
  'wife', 'wild', 'will', 'wilt', 'wily', 'wind', 'wine', 'wing', 'wink', 'wipe',
  'wire', 'wise', 'wish', 'with', 'woke', 'wolf', 'womb', 'wood', 'wool', 'word',
  'wore', 'work', 'worm', 'worn', 'wrap', 'wren', 'writ', 'yard', 'yarn', 'yawn',
  'year', 'yell', 'yoga', 'yoke', 'your', 'yurt', 'zany', 'zero', 'zest', 'zinc',
  'zone', 'zoom',
] as const

export function randomPassphrase(wordCount = 6): string {
  const bytes = randomBytes(wordCount * 2)
  const words: string[] = []
  const n = WORDS.length
  const max = 256 - (256 % n)
  let i = 0
  while (words.length < wordCount) {
    if (i >= bytes.length) {
      const more = randomBytes(wordCount * 2)
      bytes.set(more, i)
    }
    const b = bytes[i++]!
    if (b >= max) continue
    words.push(WORDS[b % n]!)
  }
  return words.join('-')
}

export function randomUsername(): string {
  return `svc_${randomHex(4)}`
}

export function randomDbPassword(length = 32): string {
  const charset = UPPER + LOWER + DIGITS + SYMBOLS
  let pwd = randomSecureString(charset, length)
  const ensure = (set: string) => {
    if (![...pwd].some((c) => set.includes(c))) {
      const i = randomBytes(1)[0]! % length
      const c = set[randomBytes(1)[0]! % set.length]!
      pwd = pwd.slice(0, i) + c + pwd.slice(i + 1)
    }
  }
  ensure(UPPER)
  ensure(LOWER)
  ensure(DIGITS)
  ensure(SYMBOLS)
  return pwd
}
