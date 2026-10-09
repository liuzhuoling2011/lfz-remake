"""Best-guess categories / descriptions for assets (heuristic, path + editor-name based)."""
import os, re

CHAR = {'01': 'Old Master Q 老夫子', '02': 'Big Potato 大番薯', '03': 'Mr. Chin 秦先生', '04': 'Mr. Chiu 趙先生',
        '05': 'Miss Chan 陳小姐', '06': 'Siu Ming 小明', '07': 'Thief 小偷 (NPC)', '08': 'Thug 惡人 (NPC)',
        '09': 'Robot 機械人 (NPC)', '10': 'God of Wealth 財神 (NPC)', '11': 'Construction Goddess 工程女神 (NPC)',
        '12': 'Card God 卡神 (NPC)', '13': 'Tiger 猛虎 (NPC attacker; editor name says character08)'}
ANIM = {'01': 'stand/idle', '02': 'walk', '03': 'timeout/idle-long', '04': 'use card', '05': 'hit by card'}
VOICE_PREFIX = {'MQ': 'Old Master Q', 'BP': 'Big Potato', 'MC': 'Mr. Chin', 'MH': 'Mr. Chiu', 'PG': 'Miss Chan', 'SM': 'Siu Ming'}

KNOWN = {
 'sprites/dice/dice_': 'dice roll animation (full-screen-positioned frames)',
 'sprites/interface/calc': 'money calculator / counting numbers UI', 'sprites/interface/card': 'four-word card (四字真言) UI panel',
 'sprites/interface/chance': 'chance event popup frame', 'sprites/interface/cursor': 'mouse cursor',
 'sprites/interface/detailinfo': 'player detail info panel', 'sprites/interface/face': 'player face portrait (HUD)',
 'sprites/interface/gameover': 'game over screen', 'sprites/interface/game_menu': 'in-game menu',
 'sprites/interface/home': 'home (屋企) panel', 'sprites/interface/info': 'player status HUD',
 'sprites/interface/loadsave': 'load/save screen', 'sprites/interface/luckydraw': 'lucky draw (Mark Six/馬票) UI',
 'sprites/interface/messagebox': 'message box', 'sprites/interface/smessagebox': 'small message box',
 'sprites/interface/movehome': 'move-home UI', 'sprites/interface/option': 'options button/panel',
 'sprites/interface/round': 'round/week counter', 'sprites/interface/selecthome': 'select home location UI',
 'sprites/interface/step': 'step-count indicator', 'sprites/interface/system': 'system buttons',
 'sprites/interface/walk': 'walk/move indicator', 'sprites/mainmenu/bg': 'main menu background art (characters)',
 'sprites/mainmenu/menu': 'main menu buttons', 'sprites/mainmenu/money': 'main menu falling-money animation',
 'sprites/logo/bg': 'title/logo screen background', 'sprites/logo/button': 'title screen button',
 'sprites/option/': 'options screen', 'sprites/interface/option/': 'in-game options screen',
 'sprites/selectactor/': 'character select screen', 'sprites/selectmap/': 'map (district) select screen',
 'sprites/selectminigame/': 'mini-game select screen', 'sprites/selectyear/': 'game-length (years) select screen',
 'sprites/season/': 'season change overlay (spring/summer/autumn/winter)', 'sprites/winner/': 'winner screen',
 'sprites/ending/': 'ending / credits', 'sprites/misc/balloon': 'speech balloon', 'sprites/misc/loading': 'loading screen',
 'sprites/misc/mark': 'marker', 'sprites/misc/pattern': 'background pattern tile',
 'sprites/minigame/01/': 'mini-game 1 (colour-tile grab, 4 player quadrants)', 'sprites/minigame/02/': 'mini-game 2 (rhythm / cymbal-clap vs robot)',
 'sprites/minigame/03/': 'mini-game 3 (slingshot at thief / karate thug)', 'sprites/minigame/04/': 'mini-game 4 (balloon pumping)',
 'sprites/minigame/result': 'mini-game result screen', 'sprites/minigame/turn/': 'mini-game selection roulette',
 'sprites/minigame/': 'mini-game common UI',
 'sprites/map/playermark': 'player marker over token', 'sprites/map/cardhit': 'card-hit effect', 'sprites/map/usecard': 'use-card effect',
 'sprites/map/god': 'god (財神 etc.) appear animation', 'sprites/map/getmoney': 'get-money effect', 'sprites/map/lostmoney': 'lose-money effect',
 'sprites/map/buildhouse': 'house construction animation', 'sprites/map/a_buildhouse': 'house construction animation (ancient map)',
 'sprites/map/downhouse': 'house demolition animation', 'sprites/map/a_downhouse': 'house demolition animation (ancient map)',
 'sprites/map/home': 'player home building (level)', 'sprites/map/a_home': 'player home building (ancient map)',
 'sprites/map/house': 'residential building lot (level)', 'sprites/map/commcal': 'commercial building lot (level)',
 'sprites/map/eating': 'restaurant building lot (level)',
}

def category_of(it):
    p = it['path']; t = it['type']
    if t == 'audio':
        return 'audio_music' if '/music/' in p else 'audio_voice' if '/voice/' in p else 'audio_sfx'
    if t in ('text', 'map', 'font', 'video'): return {'text': 'data_text', 'map': 'maps', 'font': 'fonts', 'video': 'video'}[t]
    if t == 'image': return 'cards_events'
    if p.startswith('sprites/map/character/'): return 'map_characters'
    if p.startswith('sprites/map/'):
        m = it.get('meta') or {}
        if m.get('groups') == 4 and (m.get('tiles_w', 1) > 1 or set(m.get('frames_per_group', [])) == {1}): return 'map_buildings'
        return 'map_tiles_fx'
    if p.startswith('sprites/dice/'): return 'dice'
    if p.startswith('sprites/interface/'): return 'ui_ingame'
    if p.startswith('sprites/minigame/'): return 'minigames'
    if re.match(r'sprites/(mainmenu|logo|option|select)', p): return 'ui_menus'
    return 'ui_misc'

def describe(it):
    p = it['path']; t = it['type']
    if t == 'sprite':
        m = re.match(r'sprites/map/character/character(\d\d)_(\d\d)', p)
        if m: return 'board token %s — %s, 4 directions' % (CHAR.get(m.group(1), m.group(1)), ANIM.get(m.group(2), m.group(2)))
        for k in sorted(KNOWN, key=len, reverse=True):
            if p.startswith(k): base = KNOWN[k]; break
        else: base = os.path.splitext(os.path.basename(p))[0].replace('_', ' ')
        m2 = it.get('meta')
        if m2:
            extra = '「%s」' % m2['name_zh']
            if p.startswith('sprites/map/'):
                extra += ' %dx%d tiles, %s' % (m2['tiles_w'], m2['tiles_h'], ('4 dirs x %s' % m2['frames_per_group']) if m2['groups'] == 4 else '%d frames' % sum(m2['frames_per_group']))
            return base + ' ' + extra if base != os.path.splitext(os.path.basename(p))[0].replace('_', ' ') else 'map sprite ' + extra
        mm = re.search(r'(player|character|face)(\d\d)', p)
        if mm and mm.group(1) in ('character', 'face'): base += ' — ' + CHAR.get(mm.group(2), '')
        elif mm: base += ' — player %d' % int(mm.group(2))
        return base
    if t == 'image':
        n = os.path.basename(p).lower()
        if n.startswith('lucky_chance'): return 'good-luck chance card illustration (see data/text/exttext/chance)'
        if n.startswith('bad_chance'): return 'bad-luck chance card illustration'
        if n.startswith(('a_', 'b_')): return 'four-word card (四字真言) illustration (see data/text/exttext/wordcard)'
        return 'NPC attack event illustration'
    if t == 'audio':
        n = os.path.splitext(os.path.basename(p))[0]
        if '/music/' in p: return 'background music track'
        if '/voice/' in p:
            k = n[:2].upper()
            if k in VOICE_PREFIX: return 'voice line — %s #%s%s' % (VOICE_PREFIX[k], n[2:].replace('_wav', ''), ' (PCM twin)' if n.endswith('_wav') else '')
            return 'voice/narration %s' % n
        return 'sound effect (%s)' % os.path.dirname(p).split('/')[-1]
    if t == 'text':
        n = os.path.basename(p)
        return {'chance.json': 'chance events (title, jpg, text, result, voice)', 'wordcard.json': 'four-word cards: title, art, text, target, effect',
                'maindata.json': 'actor names, UI strings, SFX/music tables, map list, building messages',
                'data.json': 'mini-game 2 tables'}.get(n, 'character dialogue lines + voice prefixes' if 'character' in n else 'text table')
    if t == 'map': return 'isometric board map (layers: sea, land, lots, roads, walkways, tram, icons, buildings, labels with lot prices)'
    if t == 'font': return 'bitmap font atlas (ASCII + Big5 CJK)'
    if t == 'video': return 'intro logo movie'
    return ''
