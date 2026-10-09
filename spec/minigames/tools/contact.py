#!/usr/bin/env python3
"""Contact sheets per mini-game: every frame of every sprite, labelled path#frame (w x h, hx,hy)."""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
A='/workspace/lfz-remake/assets'; OUT='/workspace/lfz-remake/spec/minigames'
GROUPS={
 'common':['minigame/ready','minigame/finish','minigame/timeout','minigame/pressbutton',
           'minigame/turn/bg','minigame/turn/game01','minigame/turn/game02','minigame/turn/game03','minigame/turn/game04',
           'selectminigame/bg','selectminigame/fg'],
 'result':['minigame/result/bg']+[f'minigame/result/player0{i}' for i in range(1,5)]+[f'minigame/result/character0{i}' for i in range(1,7)]
          +['minigame/result2/bg','minigame/result2/face','minigame/result2/number']+[f'minigame/result2/player0{i}' for i in range(1,5)],
 '01':['minigame/01/bg','minigame/01/arrow','minigame/01/cursor']+[f'minigame/01/character0{i}' for i in range(1,7)],
 '02':['minigame/02/bg','minigame/02/robot','minigame/02/hand','minigame/02/music']+[f'minigame/02/player0{i}' for i in range(1,5)],
 '03':['minigame/03/bg','minigame/03/stone']+[f'minigame/03/hand0{i}' for i in range(1,5)]+[f'minigame/03/thief_0{i}' for i in range(1,6)],
 '04':['minigame/04/bg','minigame/04/balloon']+[f'minigame/04/player0{i}' for i in range(1,5)],
}
try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',11)
except Exception: font=ImageFont.load_default()
MAXW=1400
def checker(w,h):
    im=Image.new('RGBA',(w,h),(200,200,200,255)); d=ImageDraw.Draw(im)
    for y in range(0,h,8):
        for x in range(0,w,8):
            if (x//8+y//8)%2: d.rectangle([x,y,x+7,y+7],fill=(170,170,170,255))
    return im
for gid,names in GROUPS.items():
    tiles=[]
    for n in names:
        j=json.load(open(f'{A}/sprites/{n}.json')); sheet=Image.open(f'{A}/sprites/{n}.png').convert('RGBA')
        for i,f in enumerate(j['frames']):
            if f['w']==0: continue
            fr=sheet.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
            s=min(1.0,320/max(f['w'],f['h']))
            if s<1: fr=fr.resize((max(1,int(f['w']*s)),max(1,int(f['h']*s))))
            tiles.append((f"{n.replace('minigame/','mg/')}#{i} {f['w']}x{f['h']} h({f['hx']},{f['hy']})",fr,s))
    # layout rows
    x=y=0; rowh=0; pos=[]
    for lab,fr,s in tiles:
        tw=max(fr.width,200)+8; th=fr.height+18
        if x+tw>MAXW: x=0; y+=rowh; rowh=0
        pos.append((x,y)); x+=tw; rowh=max(rowh,th)
    H=y+rowh; im=Image.new('RGBA',(MAXW,H),(40,40,48,255)); d=ImageDraw.Draw(im)
    for (lab,fr,s),(px,py) in zip(tiles,pos):
        im.paste(checker(fr.width,fr.height),(px,py+14)); im.alpha_composite(fr,(px,py+14))
        d.text((px,py),lab+('' if s==1 else f' @{s:.2f}'),fill=(255,255,120,255),font=font)
    im.convert('RGB').save(f'{OUT}/minigame_{gid}_assets.png'); print(gid,len(tiles),im.size)
