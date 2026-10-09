// ==== FUN_0041dfe0 @ 0041dfe0
undefined4 FUN_0041dfe0(int param_1)
{
  uint *puVar1;
  char acStack_100 [256];
  DAT_00448870 = param_1 < 100;
  if (!(bool)DAT_00448870) {
    param_1 = param_1 + -100;
  }
  FUN_00425790(DAT_00448888,s_Music_00441318);
  FUN_00436395(acStack_100,(byte *)s_MiniGame_d_004433ec);
  puVar1 = (uint *)FUN_00425860(DAT_00448888,acStack_100,0);
  FUN_0040ed40(puVar1);
  _DAT_0044886c = (void *)thunk_FUN_004278d0();
  _DAT_00448874 = FUN_004204a0(param_1,FUN_0041e0b0,FUN_0041e1c0,FUN_0041e210,FUN_0041e2c0);
  FUN_00420540(_DAT_0044886c,(int)_DAT_00448874,0);
  FUN_00420540(_DAT_0044886c,DAT_004486a0,0xffffffff);
  FUN_004238c0(0x28);
  return 1;
}
// ==== FUN_0041e0b0 @ 0041e0b0
undefined4 FUN_0041e0b0(int param_1,undefined4 param_2)
{
  undefined4 *puVar1;
  int *piVar2;
  void *pvVar3;
  CHAR aCStack_100 [256];
  puVar1 = _malloc(0x2c);
  puVar1[6] = param_2;
  piVar2 = FUN_00420e00(s_dat_MiniGame_turn_bg_spr_00443434);
  puVar1[2] = piVar2;
  pvVar3 = FUN_004234f0(s_dat_MiniGame_turn_frame_wav_00443418,2);
  puVar1[1] = pvVar3;
  FUN_00436395(aCStack_100,(byte *)s_dat_MiniGame_turn_game_02d_spr_004433f8);
  piVar2 = FUN_00420e00(aCStack_100);
  puVar1[3] = piVar2;
  FUN_00436395(aCStack_100,(byte *)s_dat_MiniGame_turn_game_02d_spr_004433f8);
  piVar2 = FUN_00420e00(aCStack_100);
  puVar1[4] = piVar2;
  FUN_00436395(aCStack_100,(byte *)s_dat_MiniGame_turn_game_02d_spr_004433f8);
  piVar2 = FUN_00420e00(aCStack_100);
  puVar1[5] = piVar2;
  piVar2 = FUN_00423f30(DAT_00448914);
  *puVar1 = piVar2;
  puVar1[7] = 0;
  puVar1[8] = 0;
  puVar1[10] = DAT_004437bc / 2;
  puVar1[9] = *(int *)**(undefined4 **)(puVar1[2] + 0xc) / 2 + DAT_004437b8;
  *(undefined4 **)(param_1 + 0x10) = puVar1;
  FUN_004235b0((void *)puVar1[1],0xff,0x80,0,'\0');
  return 1;
}
// ==== FUN_0041e1c0 @ 0041e1c0
void FUN_0041e1c0(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00423540((LPVOID)puVar1[1]);
  FUN_00420f10((LPVOID)puVar1[2]);
  FUN_00420f10((LPVOID)puVar1[4]);
  FUN_00420f10((LPVOID)puVar1[5]);
  FUN_00420f10((LPVOID)puVar1[3]);
  FUN_00423eb0((LPVOID)*puVar1);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_0041e210 @ 0041e210
void FUN_0041e210(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = FUN_0040e970(*(int *)(iVar1 + 0x24),DAT_004437b8 / 2,8);
  if (iVar2 == 0) {
    *(code **)(param_1 + 8) = FUN_0041e250;
    return;
  }
  *(int *)(iVar1 + 0x24) = *(int *)(iVar1 + 0x24) + iVar2;
  return;
}
// ==== FUN_0041e250 @ 0041e250
void FUN_0041e250(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = *(int *)(iVar1 + 0x1c) + 1;
  *(int *)(iVar1 + 0x1c) = iVar2;
  if (0x1e < iVar2) {
    *(undefined4 *)(iVar1 + 0x1c) = 0;
    if (*(int *)(iVar1 + 0x20) == **(int **)(iVar1 + 0xc) + -1) {
      if (DAT_00448870 != '\0') {
        FUN_00423890(*(undefined4 *)(*(int *)(iVar1 + 0x18) * 4 + 0x4433c0),1);
        return;
      }
      FUN_00423890(*(undefined4 *)(*(int *)(iVar1 + 0x18) * 4 + 0x4433c0),0);
      return;
    }
    *(int *)(iVar1 + 0x20) = *(int *)(iVar1 + 0x20) + 1;
  }
  return;
}
// ==== FUN_0041e2c0 @ 0041e2c0
void FUN_0041e2c0(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00424270((void *)*puVar1,0,0,0x100,0);
  FUN_00421910((void *)puVar1[4],puVar1[8],puVar1[9] + -0x267,puVar1[10] + -0x8c,0x100,0);
  FUN_00421910((void *)puVar1[3],puVar1[8],puVar1[9] + -0xbe,puVar1[10] + -0x8c,0x100,0);
  FUN_00421910((void *)puVar1[5],puVar1[8],puVar1[9] + 0xee,puVar1[10] + -0x8c,0x100,0);
  FUN_00421910((void *)puVar1[2],0,puVar1[9],puVar1[10],0x100,0);
  return;
}
// ==== FUN_0041e370 @ 0041e370
void FUN_0041e370(void)
{
  undefined4 *puVar1;
  undefined4 *puVar2;
  undefined4 *puVar3;
  FUN_00420590(_DAT_0044886c,DAT_004486a0);
  FUN_00420590(_DAT_0044886c,(int)_DAT_00448874);
  FUN_00420500(_DAT_00448874);
  puVar3 = _DAT_0044886c;
  puVar2 = (undefined4 *)*_DAT_0044886c;
  while (puVar2 != (undefined4 *)0x0) {
    puVar1 = (undefined4 *)*puVar2;
    FUN_00436366(puVar2);
    puVar2 = puVar1;
  }
  FUN_00436366(puVar3);
  return;
}
// ==== FUN_0041e3b0 @ 0041e3b0
void FUN_0041e3b0(void)
{
  int *piVar1;
  int iVar2;
  code *pcVar3;
  int iVar4;
  iVar4 = *(int *)(_DAT_0044886c + 4);
  while (iVar4 != 0) {
    iVar2 = *(int *)(iVar4 + 4);
    piVar1 = (int *)(iVar4 + 8);
    pcVar3 = *(code **)(*piVar1 + 8);
    iVar4 = iVar2;
    if (pcVar3 != (code *)0x0) {
      (*pcVar3)(*piVar1);
    }
  }
  return;
}
// ==== FUN_0041e3c0 @ 0041e3c0
void FUN_0041e3c0(void)
{
  int *piVar1;
  undefined4 *puVar2;
  code *pcVar3;
  undefined4 *puVar4;
  puVar4 = (undefined4 *)*_DAT_0044886c;
  while (puVar4 != (undefined4 *)0x0) {
    puVar2 = (undefined4 *)*puVar4;
    piVar1 = puVar4 + 2;
    pcVar3 = *(code **)(*piVar1 + 0xc);
    puVar4 = puVar2;
    if (pcVar3 != (code *)0x0) {
      (*pcVar3)(*piVar1);
    }
  }
  return;
}
// ==== FUN_0041e3d0 @ 0041e3d0
void FUN_0041e3d0(void)
{
  uint uVar1;
  code *pcVar2;
  code *pcVar3;
  code *pcVar4;
  code *pcVar5;
  pcVar5 = FUN_0041e4b0;
  pcVar4 = FUN_0041e490;
  pcVar3 = FUN_0041e460;
  pcVar2 = FUN_0041e400;
  uVar1 = FUN_00436815();
  FUN_004204a0((int)uVar1 % 3,pcVar2,pcVar3,pcVar4,pcVar5);
  return;
}
// ==== FUN_0041e400 @ 0041e400
undefined4 FUN_0041e400(int param_1,int param_2)
{
  undefined4 *puVar1;
  int *piVar2;
  undefined4 *puVar3;
  puVar1 = _malloc(8);
  piVar2 = FUN_00423f30(DAT_00448914);
  *puVar1 = piVar2;
  puVar3 = FUN_00427560(DAT_00448914,piVar2,*(int *)(&DAT_004433e0 + param_2 * 4),2000);
  puVar1[1] = puVar3;
  *(undefined4 **)(param_1 + 0x10) = puVar1;
  FUN_00420540(DAT_004488e0,param_1,20000);
  return 1;
}
// ==== FUN_0041e460 @ 0041e460
void FUN_0041e460(int param_1)
{
  undefined4 *puVar1;
  FUN_00420590(DAT_004488e0,param_1);
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_004275b0((LPVOID)puVar1[1]);
  FUN_00423eb0((LPVOID)*puVar1);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_0041e490 @ 0041e490
void __cdecl FUN_0041e490(LPVOID param_1)
{
  char cVar1;
  cVar1 = FUN_004275d0(*(int *)(*(int *)((int)param_1 + 0x10) + 4));
  if (cVar1 == '\0') {
    FUN_00420500(param_1);
  }
  return;
}
// ==== FUN_0041e4b0 @ 0041e4b0
void FUN_0041e4b0(int param_1)
{
  FUN_004275f0(*(int *)(*(int *)(param_1 + 0x10) + 4));
  return;
}
// ==== FUN_0041e4c0 @ 0041e4c0
void FUN_0041e4c0(undefined4 param_1)
{
  FUN_004204a0(param_1,FUN_0041e4f0,FUN_0041e5a0,FUN_0041e630,FUN_0041e5d0);
  return;
}
// ==== FUN_0041e4f0 @ 0041e4f0
undefined4 FUN_0041e4f0(int param_1,int param_2)
{
  int *piVar1;
  int *piVar2;
  void *this;
  int iVar3;
  piVar1 = _malloc(0x28);
  piVar2 = FUN_00420e00(*(LPCSTR *)(param_2 * 4 + 0x443450));
  *piVar1 = (int)piVar2;
  this = FUN_004234f0(s_dat_MiniGame_zoomin_wav_004434a8,2);
  *(undefined1 *)(piVar1 + 2) = 0;
  piVar1[1] = (int)this;
  iVar3 = DAT_004437bc / 2;
  piVar1[6] = iVar3;
  piVar1[5] = iVar3;
  piVar1[3] = -(*(int *)**(undefined4 **)(*piVar1 + 0xc) / 2);
  iVar3 = **(int **)(*(int *)(*piVar1 + 0xc) + 4) / 2 + DAT_004437b8;
  piVar1[7] = 0;
  piVar1[4] = iVar3;
  piVar1[8] = 0x20;
  FUN_004235b0(this,200,0x80,0,'\0');
  piVar1[9] = 0x3c;
  *(int **)(param_1 + 0x10) = piVar1;
  return 1;
}
// ==== FUN_0041e5a0 @ 0041e5a0
void FUN_0041e5a0(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00423540((LPVOID)puVar1[1]);
  FUN_00420f10((LPVOID)*puVar1);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_0041e5d0 @ 0041e5d0
void FUN_0041e5d0(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00421910((void *)*puVar1,1,puVar1[3],puVar1[5],0x100,0);
  FUN_00421910((void *)*puVar1,0,puVar1[4],puVar1[6],0x100,0);
  FUN_00421910((void *)*puVar1,2,DAT_004437b8 / 2,DAT_004437bc / 2,puVar1[7],0);
  return;
}
// ==== FUN_0041e630 @ 0041e630
void FUN_0041e630(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = FUN_0040e970(*(int *)(iVar1 + 0xc),DAT_004437b8 / 2,4);
  *(int *)(iVar1 + 0xc) = *(int *)(iVar1 + 0xc) + iVar2;
  iVar2 = FUN_0040e970(*(int *)(iVar1 + 0x10),DAT_004437b8 / 2,4);
  iVar2 = *(int *)(iVar1 + 0x10) + iVar2;
  *(int *)(iVar1 + 0x10) = iVar2;
  if (*(int *)(iVar1 + 0x1c) < 0xff) {
    *(int *)(iVar1 + 0x1c) = *(int *)(iVar1 + 0x1c) + 0x10;
  }
  else {
    *(undefined4 *)(iVar1 + 0x1c) = 0xff;
  }
  if ((*(int *)(iVar1 + 0xc) == iVar2) &&
     (iVar2 = *(int *)(iVar1 + 0x24) + -1, *(int *)(iVar1 + 0x24) = iVar2, iVar2 == 0)) {
    *(undefined4 *)(iVar1 + 0x1c) = 0xff;
    *(undefined4 *)(iVar1 + 0x20) = 0x20;
    *(code **)(param_1 + 8) = FUN_0041e7b0;
    *(code **)(param_1 + 0xc) = FUN_0041e6c0;
  }
  return;
}
// ==== FUN_0041e6c0 @ 0041e6c0
void FUN_0041e6c0(int param_1)
{
  int *piVar1;
  int *piVar2;
  int iVar3;
  int iVar4;
  piVar1 = *(int **)(param_1 + 0x10);
  piVar2 = *(int **)(*(int *)(*piVar1 + 0xc) + 4);
  iVar3 = piVar2[1] * piVar1[8];
  iVar4 = *piVar2 * piVar1[8];
  FUN_00421ef0(piVar2,DAT_004437b8 / 2,DAT_004437bc / 2,(int)(iVar4 + (iVar4 >> 0x1f & 0x1fU)) >> 5,
               (int)(iVar3 + (iVar3 >> 0x1f & 0x1fU)) >> 5,0x100,0);
  piVar2 = (int *)**(undefined4 **)(*piVar1 + 0xc);
  iVar3 = piVar2[1] * piVar1[8];
  iVar4 = *piVar2 * piVar1[8];
  FUN_00421ef0(piVar2,DAT_004437b8 / 2,DAT_004437bc / 2,(int)(iVar4 + (iVar4 >> 0x1f & 0x1fU)) >> 5,
               (int)(iVar3 + (iVar3 >> 0x1f & 0x1fU)) >> 5,0x100,0);
  piVar2 = *(int **)(*(int *)(*piVar1 + 0xc) + 8);
  iVar3 = piVar2[1] * piVar1[8];
  iVar4 = *piVar2 * piVar1[8];
  FUN_00421ef0(piVar2,DAT_004437b8 / 2,DAT_004437bc / 2,(int)(iVar4 + (iVar4 >> 0x1f & 0x1fU)) >> 5,
               (int)(iVar3 + (iVar3 >> 0x1f & 0x1fU)) >> 5,0x100,0);
  return;
}
// ==== FUN_0041e7b0 @ 0041e7b0
void FUN_0041e7b0(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  if (1 < (int)puVar1[8]) {
    puVar1[8] = puVar1[8] + -1;
  }
  if (puVar1[8] == 1) {
    if (3 < *(int *)*puVar1) {
      *(code **)(param_1 + 8) = FUN_0041e850;
      *(code **)(param_1 + 0xc) = FUN_0041e7f0;
      return;
    }
    *(undefined4 *)(param_1 + 8) = 0;
    *(undefined1 *)(puVar1 + 2) = 1;
  }
  return;
}
// ==== FUN_0041e7f0 @ 0041e7f0
void FUN_0041e7f0(int param_1)
{
  int *this;
  int iVar1;
  int iVar2;
  iVar2 = (*(int **)(param_1 + 0x10))[8];
  this = *(int **)(*(int *)(**(int **)(param_1 + 0x10) + 0xc) + 0xc);
  iVar1 = this[1] * iVar2;
  iVar2 = *this * iVar2;
  FUN_00421ef0(this,DAT_004437b8 / 2,DAT_004437bc / 2,(int)(iVar2 + (iVar2 >> 0x1f & 0x1fU)) >> 5,
               (int)(iVar1 + (iVar1 >> 0x1f & 0x1fU)) >> 5,0x100,0);
  return;
}
// ==== FUN_0041e850 @ 0041e850
void FUN_0041e850(int param_1)
{
  int iVar1;
  iVar1 = *(int *)(param_1 + 0x10);
  if (*(int *)(iVar1 + 0x20) < 0x20) {
    *(int *)(iVar1 + 0x20) = *(int *)(iVar1 + 0x20) + 3;
  }
  if (0x1f < *(int *)(iVar1 + 0x20)) {
    *(undefined4 *)(iVar1 + 0x20) = 0x20;
    *(undefined4 *)(iVar1 + 0x24) = 0;
    *(code **)(param_1 + 8) = FUN_0041e890;
  }
  return;
}
// ==== FUN_0041e890 @ 0041e890
void FUN_0041e890(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = *(int *)(iVar1 + 0x24) + 1;
  *(int *)(iVar1 + 0x24) = iVar2;
  if (iVar2 == 0x28) {
    *(undefined1 *)(iVar1 + 8) = 1;
    *(undefined4 *)(param_1 + 8) = 0;
  }
  return;
}
// ==== FUN_0041e8b0 @ 0041e8b0
undefined1 FUN_0041e8b0(int param_1)
{
  return *(undefined1 *)(*(int *)(param_1 + 0x10) + 8);
}
// ==== FUN_0041e8c0 @ 0041e8c0
void FUN_0041e8c0(undefined4 param_1)
{
  FUN_004204a0(param_1,FUN_0041e8f0,FUN_0041ed20,FUN_0041ed90,FUN_0041ee00);
  return;
}
// ==== FUN_0041e8f0 @ 0041e8f0
undefined4 FUN_0041e8f0(int param_1,int *param_2)
{
  int iVar1;
  undefined4 *puVar2;
  int iVar3;
  int *piVar4;
  undefined4 uVar5;
  undefined4 *puVar6;
  int *piVar7;
  int iVar8;
  int iVar9;
  int aiStack_14 [5];
  puVar2 = _malloc(0x2c);
  iVar3 = FUN_00424430(s_dat_MiniGame_01_number_fnt_00442fe0,0);
  puVar2[6] = iVar3;
  *(undefined1 *)(iVar3 + 0xd) = 1;
  *(undefined1 *)(puVar2[6] + 0xc) = 1;
  FUN_00424500((void *)puVar2[6],0xff,0xff,0xff);
  piVar4 = FUN_00420e00(s_dat_MiniGame_result2_face_spr_004434e0);
  puVar2[8] = piVar4;
  piVar4 = FUN_00420e00(s_dat_MiniGame_result2_number_spr_004434c0);
  puVar2[7] = piVar4;
  uVar5 = thunk_FUN_004278d0();
  *puVar2 = uVar5;
  puVar6 = FUN_004204a0(0,FUN_0041ead0,FUN_0041e5a0,FUN_0041eb30,FUN_0041eb60);
  puVar2[1] = puVar6;
  FUN_00420540((void *)*puVar2,(int)puVar6,0);
  iVar3 = 0;
  aiStack_14[0] = -8 - (int)puVar2;
  piVar4 = puVar2 + 2;
  do {
    if (*param_2 == -1) {
      *piVar4 = 0;
    }
    else {
      puVar6 = FUN_004204a0(iVar3,FUN_0041eb80,FUN_00404510,FUN_0041ec00,FUN_0041ec50);
      *piVar4 = (int)puVar6;
      iVar8 = puVar6[4];
      *(int *)(iVar8 + 0x10) = *param_2;
      *(undefined4 *)(iVar8 + 4) =
           *(undefined4 *)
            (*(int *)(puVar2[8] + 0xc) +
            **(int **)((int)piVar4 + *(int *)(DAT_004488bc + 4) + aiStack_14[0]) * 4);
      *(undefined4 *)(iVar8 + 8) =
           *(undefined4 *)((int)piVar4 + *(int *)(puVar2[7] + 0xc) + aiStack_14[0]);
      *(undefined4 *)(iVar8 + 0xc) = puVar2[6];
      FUN_00420540((void *)*puVar2,*piVar4,iVar3);
    }
    iVar3 = iVar3 + 1;
    param_2 = param_2 + 1;
    piVar4 = piVar4 + 1;
  } while (iVar3 < 4);
  piVar4 = puVar2 + 2;
  puVar6 = (undefined4 *)0x0;
  piVar7 = aiStack_14 + 1;
  iVar3 = 4;
  do {
    if (*piVar4 != 0) {
      puVar6 = (undefined4 *)((int)puVar6 + 1);
      *piVar7 = *(int *)(*piVar4 + 0x10);
      piVar7 = piVar7 + 1;
    }
    piVar4 = piVar4 + 1;
    iVar3 = iVar3 + -1;
  } while (iVar3 != 0);
  FUN_004369fc(aiStack_14 + 1,puVar6,4,FUN_0041ed00);
  iVar3 = 0;
  if (0 < (int)puVar6) {
    iVar8 = 0;
    iVar9 = 0x1e;
    do {
      *(int *)(aiStack_14[iVar3 + 1] + 0x20) = iVar9;
      iVar9 = iVar9 + 0x1e;
      *(undefined4 *)(aiStack_14[iVar3 + 1] + 8) =
           *(undefined4 *)(*(int *)(puVar2[7] + 0xc) + iVar3 * 4);
      iVar3 = iVar3 + 1;
      iVar1 = (DAT_004437bc + -0x1e0) / 2 + 0x8c + iVar8;
      iVar8 = iVar8 + 0x4d;
      *(int *)(aiStack_14[iVar3] + 0x1c) = iVar1;
    } while (iVar3 < (int)puVar6);
  }
  puVar2[10] = 0;
  puVar2[9] = 0x140;
  *(undefined4 **)(param_1 + 0x10) = puVar2;
  return 1;
}
// ==== FUN_0041ead0 @ 0041ead0
undefined4 FUN_0041ead0(int param_1)
{
  int iVar1;
  undefined4 *puVar2;
  int *piVar3;
  void *this;
  puVar2 = _malloc(0x10);
  piVar3 = FUN_00420e00(s_dat_MiniGame_result2_bg_spr_00443520);
  *puVar2 = piVar3;
  this = FUN_004234f0(s_dat_MiniGame_result2_dan02_wav_00443500,2);
  puVar2[1] = this;
  FUN_004235b0(this,0xff,0x80,0,'\0');
  iVar1 = DAT_004437b8;
  puVar2[3] = 0;
  puVar2[2] = iVar1 / 2;
  *(undefined4 **)(param_1 + 0x10) = puVar2;
  return 1;
}
// ==== FUN_0041eb30 @ 0041eb30
void FUN_0041eb30(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = FUN_0040e970(*(int *)(iVar1 + 0xc),DAT_004437bc / 2,8);
  *(int *)(iVar1 + 0xc) = *(int *)(iVar1 + 0xc) + iVar2;
  return;
}
// ==== FUN_0041eb60 @ 0041eb60
void FUN_0041eb60(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00421910((void *)*puVar1,0,puVar1[2],puVar1[3],0x100,0);
  return;
}
// ==== FUN_0041eb80 @ 0041eb80
undefined4 FUN_0041eb80(int param_1)
{
  int iVar1;
  undefined4 *puVar2;
  int *piVar3;
  CHAR aCStack_100 [256];
  puVar2 = _malloc(0x24);
  FUN_00436395(aCStack_100,(byte *)s_dat_MiniGame_result2_player_02d__0044353c);
  piVar3 = FUN_00420e00(aCStack_100);
  *puVar2 = piVar3;
  puVar2[5] = DAT_004437b8 / 2;
  puVar2[6] = DAT_004437bc + 200;
  iVar1 = DAT_004437bc;
  puVar2[8] = 0;
  puVar2[7] = iVar1 / 2;
  *(undefined4 **)(param_1 + 0x10) = puVar2;
  return CONCAT31((int3)((uint)(iVar1 / 2) >> 8),1);
}
// ==== FUN_0041ec00 @ 0041ec00
void FUN_0041ec00(int param_1)
{
  int iVar1;
  iVar1 = *(int *)(*(int *)(param_1 + 0x10) + 0x20) + -1;
  *(int *)(*(int *)(param_1 + 0x10) + 0x20) = iVar1;
  if (iVar1 == 0) {
    *(code **)(param_1 + 8) = FUN_0041ec20;
  }
  return;
}
// ==== FUN_0041ec20 @ 0041ec20
void FUN_0041ec20(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = FUN_0040e970(*(int *)(iVar1 + 0x18),*(int *)(iVar1 + 0x1c),4);
  *(int *)(iVar1 + 0x18) = *(int *)(iVar1 + 0x18) + iVar2;
  return;
}
// ==== FUN_0041ec50 @ 0041ec50
void FUN_0041ec50(int param_1)
{
  undefined4 *puVar1;
  int iVar2;
  uint uVar3;
  byte abStack_10 [16];
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00421910((void *)*puVar1,0,puVar1[5],puVar1[6],0x100,0);
  FUN_00421410((void *)puVar1[1],puVar1[5] + 5,puVar1[6],0x100,0);
  FUN_00421410((void *)puVar1[2],puVar1[5] + -0x95,puVar1[6],0x100,0);
  FUN_00436395(abStack_10,&DAT_004413b4);
  iVar2 = puVar1[6];
  uVar3 = FUN_00424560(puVar1[3],abStack_10);
  FUN_00424600(puVar1[3],(puVar1[5] - (uVar3 >> 1)) + 0x9c,(byte *)(iVar2 + -10),-1,abStack_10);
  return;
}
// ==== FUN_0041ed00 @ 0041ed00
int FUN_0041ed00(int *param_1,int *param_2)
{
  return *(int *)(*param_2 + 0x10) - *(int *)(*param_1 + 0x10);
}
// ==== FUN_0041ed20 @ 0041ed20
void FUN_0041ed20(int param_1)
{
  undefined4 *puVar1;
  int iVar2;
  int *piVar3;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  iVar2 = 4;
  piVar3 = puVar1 + 2;
  do {
    if (*piVar3 != 0) {
      FUN_00420590((void *)*puVar1,*piVar3);
      FUN_00420500((LPVOID)*piVar3);
    }
    piVar3 = piVar3 + 1;
    iVar2 = iVar2 + -1;
  } while (iVar2 != 0);
  FUN_00420590((void *)*puVar1,puVar1[1]);
  FUN_00420500((LPVOID)puVar1[1]);
  func_0x00420530();
  FUN_00420f10((LPVOID)puVar1[8]);
  FUN_00420f10((LPVOID)puVar1[7]);
  FUN_004244e0((LPVOID)puVar1[6]);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_0041ed90 @ 0041ed90
void FUN_0041ed90(int param_1)
{
  int iVar1;
  int iVar2;
  int iVar3;
  int *piVar4;
  iVar1 = *(int *)(param_1 + 0x10);
  if (*(int *)(iVar1 + 0x28) == 0) {
    func_0x004205c0();
    iVar3 = *(int *)(iVar1 + 0x24) + -1;
    *(int *)(iVar1 + 0x24) = iVar3;
    if (iVar3 == 0) {
      piVar4 = (int *)(iVar1 + 8);
      iVar3 = 4;
      do {
        if ((*piVar4 != 0) &&
           (iVar2 = *(int *)(*(int *)(DAT_004488bc + 4) + (-8 - iVar1) + (int)piVar4), iVar2 != 0))
        {
          *(int *)(iVar2 + 0x28) =
               *(int *)(iVar2 + 0x28) + *(int *)(*(int *)(*piVar4 + 0x10) + 0x10);
        }
        piVar4 = piVar4 + 1;
        iVar3 = iVar3 + -1;
      } while (iVar3 != 0);
      *(undefined4 *)(iVar1 + 0x28) = 1;
    }
  }
  return;
}
// ==== FUN_0041ee00 @ 0041ee00
void FUN_0041ee00(int param_1)
{
  int *piVar1;
  undefined4 *puVar2;
  code *pcVar3;
  undefined4 *puVar4;
  puVar4 = *(undefined4 **)**(undefined4 **)(param_1 + 0x10);
  while (puVar4 != (undefined4 *)0x0) {
    puVar2 = (undefined4 *)*puVar4;
    piVar1 = puVar4 + 2;
    pcVar3 = *(code **)(*piVar1 + 0xc);
    puVar4 = puVar2;
    if (pcVar3 != (code *)0x0) {
      (*pcVar3)(*piVar1);
    }
  }
  return;
}
// ==== FUN_0041ee10 @ 0041ee10
undefined1 FUN_0041ee10(int param_1)
{
  return *(undefined1 *)(*(int *)(param_1 + 0x10) + 0x28);
}
// ==== FUN_0041ee20 @ 0041ee20
int __cdecl FUN_0041ee20(int *param_1)
{
  int iVar1;
  undefined4 *puVar2;
  iVar1 = 0;
  if (0 < *param_1) {
    puVar2 = (undefined4 *)param_1[1];
    do {
      if ((*(byte *)*puVar2 & 1) != 0) {
        return iVar1;
      }
      iVar1 = iVar1 + 1;
      puVar2 = puVar2 + 1;
    } while (iVar1 < *param_1);
  }
  return -1;
}
// ==== FUN_0041ee50 @ 0041ee50
void __cdecl FUN_0041ee50(int *param_1,int param_2)
{
  uint *puVar1;
  uint uVar2;
  int iVar3;
  iVar3 = 0;
  if (0 < *param_1) {
    do {
      puVar1 = *(uint **)(param_1[1] + iVar3 * 4);
      uVar2 = *puVar1;
      *puVar1 = uVar2 & 0xfffffffe;
      if (iVar3 == param_2) {
        *puVar1 = uVar2 & 0xfffffffe | 1;
      }
      iVar3 = iVar3 + 1;
    } while (iVar3 < *param_1);
  }
  return;
}
// ==== FUN_0041ee90 @ 0041ee90
void __cdecl FUN_0041ee90(int *param_1,uint param_2,undefined *param_3)
{
  char cVar1;
  uint *puVar2;
  bool bVar3;
  int *piVar4;
  bool bVar5;
  uint uVar6;
  char *pcVar7;
  uint uVar8;
  int iVar9;
  uVar8 = param_2;
  piVar4 = param_1;
  bVar3 = false;
  if (*(int *)(param_2 + 0x1c) == 2) {
    FUN_00420dc0(param_2,&param_1,&param_2);
    iVar9 = 0;
    bVar5 = false;
    if (0 < *piVar4) {
      do {
        bVar3 = bVar5;
        puVar2 = *(uint **)(piVar4[1] + iVar9 * 4);
        uVar6 = FUN_00420fd0((void *)puVar2[3],puVar2[4],puVar2[1],puVar2[2],(int)param_1,param_2);
        if ((char)uVar6 == '\0') {
          *puVar2 = *puVar2 & 0xfffffffe;
        }
        else {
          bVar3 = true;
          *puVar2 = *puVar2 | 1;
        }
        iVar9 = iVar9 + 1;
        bVar5 = bVar3;
      } while (iVar9 < *piVar4);
    }
  }
  pcVar7 = (char *)FUN_00426a80(uVar8);
  if (pcVar7 != (char *)0x0) {
    if (*(int *)(uVar8 + 0x1c) == 2) {
      FUN_0041ef90(piVar4,pcVar7);
    }
    else {
      FUN_0041ef90(piVar4,pcVar7);
    }
    if (pcVar7[1] == '\x01') {
      if (*(int *)(uVar8 + 0x1c) == 2) {
        if (!bVar3) goto LAB_0041ef57;
        cVar1 = *pcVar7;
      }
      else {
        cVar1 = *pcVar7;
      }
      (*(code *)param_3)(piVar4,cVar1);
    }
  }
LAB_0041ef57:
  iVar9 = 0;
  if (0 < *piVar4) {
    do {
      puVar2 = *(uint **)(piVar4[1] + iVar9 * 4);
      puVar2[4] = puVar2[5];
      if ((*puVar2 & 1) != 0) {
        if ((*puVar2 & 2) == 0) {
          uVar8 = puVar2[6];
        }
        else {
          uVar8 = puVar2[7];
        }
        puVar2[4] = uVar8;
      }
      iVar9 = iVar9 + 1;
    } while (iVar9 < *piVar4);
  }
  return;
}
