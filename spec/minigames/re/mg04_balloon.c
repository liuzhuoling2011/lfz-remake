// ==== FUN_0041d0a0 @ 0041d0a0
undefined4 FUN_0041d0a0(int param_1)
{
  undefined4 *puVar1;
  undefined4 *puVar2;
  int iVar3;
  FUN_00420a70();
  DAT_00448850 = param_1 != 0;
  FUN_0041dc00();
  _DAT_0044881c = (void *)thunk_FUN_004278d0();
  FUN_00420540(_DAT_0044881c,DAT_004486a0,0xffffffff);
  _DAT_00448834 = FUN_004204a0(0,FUN_0041d800,FUN_00404510,FUN_0041da60,FUN_0041d8a0);
  FUN_00420540(_DAT_0044881c,(int)_DAT_00448834,0);
  iVar3 = 0;
  puVar2 = (undefined4 *)0x448820;
  do {
    puVar1 = FUN_004204a0(iVar3,FUN_0041d190,FUN_0041d2d0,FUN_0041d300,FUN_0041d7b0);
    *puVar2 = puVar1;
    if (puVar1 != (undefined4 *)0x0) {
      FUN_00420540(_DAT_0044881c,(int)puVar1,10);
    }
    puVar2 = puVar2 + 1;
    iVar3 = iVar3 + 1;
  } while ((int)puVar2 < 0x448830);
  FUN_0041dca0();
  _DAT_00448858 = FUN_00423f30(DAT_00448914);
  _DAT_00443300 = FUN_0041dd60;
  _DAT_00443304 = FUN_0041ddf0;
  _DAT_00448864 = 0x172;
  _DAT_00448860 = 0x116;
  return 1;
}
// ==== FUN_0041d190 @ 0041d190
undefined4 FUN_0041d190(int param_1,uint param_2)
{
  int *piVar1;
  int *piVar2;
  int iVar3;
  int iVar4;
  CHAR aCStack_100 [256];
  iVar3 = *(int *)(*(int *)(DAT_004488bc + 4) + param_2 * 4);
  iVar4 = *(int *)(iVar3 + 0x34);
  if ((((iVar4 != -1) && (iVar4 != 1)) && (iVar4 != 2)) && (iVar4 != 5)) {
    piVar1 = _malloc(0x48);
    FUN_00436395(aCStack_100,(byte *)s_dat_MiniGame_04_player_02d_spr_00443308);
    piVar2 = FUN_00420e00(aCStack_100);
    *piVar1 = (int)piVar2;
    iVar3 = *(int *)(iVar3 + 0x1c);
    piVar1[3] = iVar3;
    FUN_00426ad0(iVar3);
    piVar1[4] = param_2;
    iVar4 = ((int)(DAT_004437b8 + (DAT_004437b8 >> 0x1f & 3U)) >> 2) * param_2 +
            ((int)(DAT_004437b8 + (DAT_004437b8 >> 0x1f & 7U)) >> 3);
    piVar1[5] = iVar4;
    iVar3 = DAT_004437bc / 2;
    piVar1[7] = iVar4;
    piVar1[6] = iVar3 + (param_2 & 1) * -0x14 + 10;
    iVar4 = DAT_004437bc;
    iVar3 = *(int *)(**(int **)(*piVar1 + 0xc) + 4);
    piVar1[10] = 1;
    piVar1[0x11] = -1;
    piVar1[0xe] = -1;
    piVar1[8] = (-(iVar3 / 2) - (iVar4 + -0x1e0) / 2) + iVar4;
    piVar1[2] = 0;
    piVar1[1] = 0;
    piVar1[0xb] = 0;
    piVar1[9] = 0;
    piVar1[0x10] = 0;
    piVar1[0xd] = 0;
    piVar1[0xc] = 0;
    *(int **)(param_1 + 0x10) = piVar1;
    return 1;
  }
  return 0;
}
// ==== FUN_0041d2d0 @ 0041d2d0
void FUN_0041d2d0(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  if (puVar1[0x10] != 0) {
    FUN_004236a0(puVar1[0x10]);
  }
  FUN_00420f10((LPVOID)*puVar1);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_0041d300 @ 0041d300
void FUN_0041d300(int param_1)
{
  int *piVar1;
  int iVar2;
  byte *pbVar3;
  piVar1 = *(int **)(param_1 + 0x10);
  if (*(char *)(*(int *)(*(int *)(DAT_004488bc + 4) + piVar1[4] * 4) + 0x3c) == '\0') {
    pbVar3 = (byte *)FUN_00426a80(piVar1[3]);
    if (((pbVar3 == (byte *)0x0) || (pbVar3[1] != 1)) || (1 < *pbVar3)) {
      iVar2 = piVar1[9];
      piVar1[9] = iVar2 + piVar1[10];
      if (iVar2 + piVar1[10] < -10) {
        piVar1[10] = 1;
      }
      if (2 < piVar1[9]) {
        piVar1[10] = -1;
      }
      return;
    }
  }
  _DAT_00448868 = _DAT_00448868 | (ushort)(1 << ((byte)piVar1[4] & 0x1f));
  *(code **)(param_1 + 8) = FUN_0041d410;
  *(code **)(param_1 + 0xc) = FUN_0041d3b0;
  piVar1[9] = *(int *)(**(int **)(*piVar1 + 0xc) + 4);
  FUN_004235b0(_DAT_00448854,0x80,0x80,0,'\0');
  return;
}
// ==== FUN_0041d3b0 @ 0041d3b0
void FUN_0041d3b0(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00422740(_DAT_00448848,0,puVar1[5],puVar1[6],puVar1[0xc],puVar1[0xd],0x100,0);
  FUN_00421910((void *)*puVar1,1,puVar1[7],puVar1[8],0x100,0);
  FUN_00421910((void *)*puVar1,0,puVar1[7],puVar1[8],0x100,0);
  return;
}
// ==== FUN_0041d410 @ 0041d410
void FUN_0041d410(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = FUN_0040e970(*(int *)(iVar1 + 0x30),*(int *)**(undefined4 **)(_DAT_00448848 + 0xc),8);
  *(int *)(iVar1 + 0x30) = *(int *)(iVar1 + 0x30) + iVar2;
  iVar2 = FUN_0040e970(*(int *)(iVar1 + 0x34),*(int *)(**(int **)(_DAT_00448848 + 0xc) + 4),8);
  *(int *)(iVar1 + 0x34) = *(int *)(iVar1 + 0x34) + iVar2;
  if ((ushort)((ushort)(1 << ((byte)*(undefined4 *)(iVar1 + 0x10) & 0x1f)) & (ushort)_DAT_00448868)
      == 0) {
    *(code **)(param_1 + 8) = FUN_0041d4a0;
  }
  if (5 < *(int *)(iVar1 + 0x24)) {
    *(int *)(iVar1 + 0x24) = *(int *)(iVar1 + 0x24) + -5;
    return;
  }
  *(undefined4 *)(iVar1 + 0x24) = 0;
  return;
}
// ==== FUN_0041d4a0 @ 0041d4a0
void FUN_0041d4a0(int param_1)
{
  int iVar1;
  undefined4 uVar2;
  int iVar3;
  iVar1 = *(int *)(param_1 + 0x10);
  uVar2 = *(undefined4 *)(iVar1 + 0x10);
  iVar3 = FUN_0040e970(*(int *)(iVar1 + 0x30),*(int *)**(undefined4 **)(_DAT_00448848 + 0xc),8);
  *(int *)(iVar1 + 0x30) = *(int *)(iVar1 + 0x30) + iVar3;
  iVar3 = FUN_0040e970(*(int *)(iVar1 + 0x34),*(int *)(**(int **)(_DAT_00448848 + 0xc) + 4),8);
  *(int *)(iVar1 + 0x34) = *(int *)(iVar1 + 0x34) + iVar3;
  if ((ushort)((ushort)_DAT_00448868 & (ushort)(1 << ((byte)uVar2 & 0x1f))) != 0) {
    *(code **)(param_1 + 8) = FUN_0041d540;
    *(code **)(param_1 + 0xc) = FUN_0041d700;
    FUN_00426ad0(*(int *)(iVar1 + 0xc));
    *(undefined4 *)(iVar1 + 0x24) = 0;
  }
  if (5 < *(int *)(iVar1 + 0x24)) {
    *(int *)(iVar1 + 0x24) = *(int *)(iVar1 + 0x24) + -5;
    return;
  }
  *(undefined4 *)(iVar1 + 0x24) = 0;
  return;
}
// ==== FUN_0041d540 @ 0041d540
void FUN_0041d540(int param_1)
{
  int iVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  iVar1 = *(int *)(param_1 + 0x10);
  if ((ushort)((ushort)(1 << ((byte)*(int *)(iVar1 + 0x10) & 0x1f)) & (ushort)_DAT_00448868) == 0) {
    *(undefined4 *)(param_1 + 8) = 0;
    return;
  }
  iVar4 = *(int *)(iVar1 + 0x2c);
  iVar3 = *(int *)(iVar1 + 0x3c) + 1;
  *(undefined4 *)(iVar1 + 8) = *(undefined4 *)(*(int *)(iVar1 + 8) * 4 + 0x4432e4);
  *(int *)(iVar1 + 0x3c) = iVar3;
  if ((5 < iVar3) && (*(undefined4 *)(iVar1 + 0x3c) = 0, 0 < iVar4)) {
    *(int *)(iVar1 + 0x2c) = iVar4 + -1;
  }
  if (*(char *)(*(int *)(*(int *)(DAT_004488bc + 4) + *(int *)(iVar1 + 0x10) * 4) + 0x3c) == '\0') {
    FUN_0041d6b0(iVar1);
  }
  else {
    FUN_0041d680();
  }
  iVar3 = *(int *)(iVar1 + 0x2c);
  iVar2 = iVar3 - iVar4;
  if (iVar4 < iVar3) {
    if (*(int *)(iVar1 + 0x44) != 0) {
      if (*(int *)(iVar1 + 0x40) != 0) {
        FUN_004236a0(*(int *)(iVar1 + 0x40));
      }
      iVar3 = FUN_004235b0(_DAT_00448838,0x40,0x80,1,'\x01');
      *(int *)(iVar1 + 0x40) = iVar3;
      *(undefined4 *)(iVar1 + 0x44) = 0;
    }
    iVar3 = *(int *)(iVar1 + 0x2c);
    iVar2 = iVar3 - iVar4;
  }
  if ((SBORROW4(iVar3,iVar4) != iVar2 < 0) && (*(int *)(iVar1 + 0x44) != 1)) {
    if (*(int *)(iVar1 + 0x40) != 0) {
      FUN_004236a0(*(int *)(iVar1 + 0x40));
    }
    iVar4 = FUN_004235b0(_DAT_0044883c,0x40,0x80,1,'\x01');
    *(int *)(iVar1 + 0x40) = iVar4;
    *(undefined4 *)(iVar1 + 0x44) = 1;
  }
  if (0xb3 < *(int *)(iVar1 + 0x2c)) {
    if (*(int *)(iVar1 + 0x40) != 0) {
      FUN_004236a0(*(int *)(iVar1 + 0x40));
    }
    iVar4 = FUN_004235b0(_DAT_00448840,0xff,0x80,0,'\0');
    *(int *)(iVar1 + 0x40) = iVar4;
  }
  *(int *)(iVar1 + 4) = (*(int *)(iVar1 + 0x2c) / 0x24) * 3;
  return;
}
// ==== FUN_0041d680 @ 0041d680
void FUN_0041d680(int param_1)
{
  uint uVar1;
  bool bVar2;
  uVar1 = FUN_00436815();
  uVar1 = uVar1 & 0x80000003;
  bVar2 = uVar1 == 0;
  if ((int)uVar1 < 0) {
    bVar2 = (uVar1 - 1 | 0xfffffffc) == 0xffffffff;
  }
  if (bVar2) {
    *(undefined4 *)(param_1 + 0x3c) = 0;
    if (*(int *)(param_1 + 0x2c) < 0xb4) {
      *(int *)(param_1 + 0x2c) = *(int *)(param_1 + 0x2c) + 1;
    }
  }
  return;
}
// ==== FUN_0041d6b0 @ 0041d6b0
void FUN_0041d6b0(int param_1)
{
  byte *pbVar1;
  pbVar1 = (byte *)FUN_00426a80(*(int *)(param_1 + 0xc));
  if (((pbVar1 != (byte *)0x0) && (pbVar1[1] == 0)) && (*pbVar1 < 2)) {
    if ((uint)*pbVar1 != *(uint *)(param_1 + 0x38)) {
      *(undefined4 *)(param_1 + 0x3c) = 0;
      if (*(int *)(param_1 + 0x2c) < 0xb4) {
        *(int *)(param_1 + 0x2c) = *(int *)(param_1 + 0x2c) + 1;
      }
    }
    *(uint *)(param_1 + 0x38) = (uint)*pbVar1;
  }
  return;
}
// ==== FUN_0041d700 @ 0041d700
void FUN_0041d700(int param_1)
{
  undefined4 *puVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int extraout_EDX;
  int iVar6;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00421910(_DAT_00448848,*(int *)(puVar1[2] * 4 + 0x4432d4) + puVar1[1],puVar1[5],puVar1[6],
               0x100,0);
  FUN_00421910((void *)*puVar1,1,puVar1[7],puVar1[8],0x100,0);
  iVar2 = puVar1[0xb];
  iVar3 = puVar1[7];
  iVar4 = puVar1[8];
  iVar5 = iVar2 >> 0x1f;
  iVar6 = 0;
  do {
    FUN_00422e70(iVar3 + -0x42,iVar2 / 2 + iVar3 + -0x42,iVar6 + iVar4 + -0xb,
                 CONCAT22((short)((uint)iVar5 >> 0x10),_DAT_00448830),0x100);
    iVar6 = iVar6 + 1;
    iVar5 = extraout_EDX;
  } while (iVar6 < 0x18);
  FUN_00421910((void *)*puVar1,0,puVar1[7],puVar1[8],0x100,0);
  return;
}
// ==== FUN_0041d7b0 @ 0041d7b0
void FUN_0041d7b0(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = *(int *)(iVar1 + 0x20) + -0x14;
  FUN_00421910(_DAT_0044884c,1,*(int *)(iVar1 + 0x1c),iVar2,0x100,0);
  FUN_00421910(_DAT_0044884c,0,*(int *)(iVar1 + 0x1c),*(int *)(iVar1 + 0x24) + iVar2,0x100,0);
  return;
}
// ==== FUN_0041d800 @ 0041d800
undefined4 FUN_0041d800(int param_1)
{
  undefined4 *puVar1;
  int *piVar2;
  uint uVar3;
  puVar1 = _malloc(0x20);
  piVar2 = FUN_00420e00(s_dat_MiniGame_04_bg_spr_00443328);
  *puVar1 = piVar2;
  puVar1[1] = DAT_004437b8 / 2;
  puVar1[2] = DAT_004437bc / 2;
  uVar3 = (**(code **)(DAT_00448910 + 8))(0x9a,0xff,0x99);
  puVar1[3] = uVar3 & 0xffff;
  uVar3 = (**(code **)(DAT_00448910 + 8))(3,0xe4,0);
  puVar1[4] = uVar3 & 0xffff;
  uVar3 = (**(code **)(DAT_00448910 + 8))(1,0x5b,0);
  puVar1[5] = uVar3 & 0xffff;
  puVar1[6] = 0;
  puVar1[7] = 0;
  *(undefined4 **)(param_1 + 0x10) = puVar1;
  return 1;
}
// ==== FUN_0041d8a0 @ 0041d8a0
void FUN_0041d8a0(int param_1)
{
  int iVar1;
  int iVar2;
  undefined4 *puVar3;
  int iVar4;
  undefined4 uVar5;
  uint uVar6;
  undefined2 extraout_var;
  int iVar7;
  byte abStack_100 [256];
  puVar3 = *(undefined4 **)(param_1 + 0x10);
  FUN_00421910((void *)*puVar3,0,puVar3[1],puVar3[2],0x100,0);
  if (0x280 < DAT_004437b8) {
    FUN_00421910((void *)*puVar3,0,puVar3[1] + -0x280,puVar3[2],0x100,0);
    FUN_00421910((void *)*puVar3,0,puVar3[1] + 0x280,puVar3[2],0x100,0);
  }
  FUN_00421910((void *)*puVar3,1,puVar3[1],puVar3[2],0x100,0);
  iVar4 = puVar3[2];
  iVar1 = puVar3[1] + -0xfd;
  iVar2 = ((uint)(puVar3[6] * 0x1e7) / 0x4b0 - 0xfd) + puVar3[1];
  uVar5 = FUN_00422e70(iVar1,iVar2,iVar4 + -0xc3,
                       CONCAT22((short)((uint)(puVar3[6] * 0x1e7) / 0x4b00000),
                                *(undefined2 *)(puVar3 + 3)),0x100);
  iVar7 = 0x2e;
  do {
    uVar5 = FUN_00422e70(iVar1,iVar2,iVar4 + -0xf0 + iVar7,
                         CONCAT22((short)((uint)uVar5 >> 0x10),*(undefined2 *)(puVar3 + 4)),0x100);
    iVar7 = iVar7 + 1;
  } while (iVar7 < 0x42);
  FUN_00422e70(iVar1,iVar2,iVar4 + -0xae,
               CONCAT22((short)((uint)uVar5 >> 0x10),*(undefined2 *)(puVar3 + 5)),0x100);
  FUN_00422ef0(iVar2,iVar4 + -0xc3,iVar4 + -0xae,CONCAT22(extraout_var,*(undefined2 *)(puVar3 + 5)),
               0x100);
  FUN_00436395(abStack_100,&DAT_00442574);
  uVar6 = FUN_00424560((int)_DAT_0044885c,abStack_100);
  *(undefined1 *)((int)_DAT_0044885c + 0xd) = 1;
  FUN_00424500(_DAT_0044885c,0xff,0xff,0xff);
  FUN_00424600((int)_DAT_0044885c,(puVar3[1] - (uVar6 >> 1)) + 0x112,(byte *)(iVar4 + -0xd9),0,
               abStack_100);
  return;
}
// ==== FUN_0041da60 @ 0041da60
void FUN_0041da60(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  if (_DAT_00448868 == _DAT_00448844) {
    iVar2 = FUN_0041e4c0(0);
    *(int *)(iVar1 + 0x1c) = iVar2;
    FUN_00420540(_DAT_0044881c,iVar2,100);
    *(code **)(param_1 + 8) = FUN_0041dab0;
    _DAT_00448868 = 0;
  }
  return;
}
// ==== FUN_0041dab0 @ 0041dab0
void FUN_0041dab0(int param_1)
{
  int iVar1;
  char cVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  cVar2 = FUN_0041e8b0(*(undefined4 *)(iVar1 + 0x1c));
  if (cVar2 != '\0') {
    FUN_00420590(_DAT_0044881c,*(int *)(iVar1 + 0x1c));
    FUN_00420500(*(LPVOID *)(iVar1 + 0x1c));
    *(code **)(param_1 + 8) = FUN_0041db00;
    _DAT_00448868 = _DAT_00448844;
  }
  return;
}
// ==== FUN_0041db00 @ 0041db00
void FUN_0041db00(int param_1)
{
  int iVar1;
  int *piVar2;
  int iVar3;
  uint uVar4;
  undefined4 uVar5;
  iVar1 = *(int *)(param_1 + 0x10);
  uVar4 = *(int *)(iVar1 + 0x18) + 1;
  *(uint *)(iVar1 + 0x18) = uVar4;
  if (uVar4 / 0x28 == 0x1e) {
    uVar5 = 1;
  }
  else {
    iVar3 = 0;
    piVar2 = (int *)0x448820;
    while ((*piVar2 == 0 || (*(int *)(*(int *)(*piVar2 + 0x10) + 0x2c) < 0xb4))) {
      piVar2 = piVar2 + 1;
      iVar3 = iVar3 + 1;
      if (0x44882f < (int)piVar2) {
        return;
      }
    }
    uVar5 = 2;
    _DAT_004432d0 = iVar3;
  }
  _DAT_00448868 = 0;
  iVar3 = FUN_0041e4c0(uVar5);
  *(int *)(iVar1 + 0x1c) = iVar3;
  FUN_00420540(_DAT_0044881c,iVar3,100);
  *(code **)(param_1 + 8) = FUN_0041db90;
  return;
}
// ==== FUN_0041db90 @ 0041db90
void FUN_0041db90(int param_1)
{
  int iVar1;
  char cVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  cVar2 = FUN_0041e8b0(*(undefined4 *)(iVar1 + 0x1c));
  if (cVar2 != '\0') {
    FUN_00420590(_DAT_0044881c,*(int *)(iVar1 + 0x1c));
    FUN_00420500(*(LPVOID *)(iVar1 + 0x1c));
    *(undefined4 *)(param_1 + 8) = 0;
    if ((_DAT_004432d0 != -1) && (DAT_00448850 == '\0')) {
      FUN_00423890(0x442ea0,_DAT_004432d0);
      return;
    }
    func_0x00423920();
  }
  return;
}
// ==== FUN_0041dc00 @ 0041dc00
void FUN_0041dc00(void)
{
  _DAT_004432d0 = 0xffffffff;
  _DAT_00448830 = (**(code **)(DAT_00448910 + 8))(0xff,0xf4,0x35);
  _DAT_00448848 = FUN_00420e00(s_dat_MiniGame_04_balloon_spr_004433a0);
  _DAT_00448854 = FUN_004234f0(s_dat_MiniGame_drip_wav_00442eb0,4);
  _DAT_0044884c = FUN_00420e00(s_dat_MiniGame_pressbutton_spr_00442f20);
  _DAT_0044885c = FUN_00424430(s_dat_MiniGame_01_number_fnt_00442fe0,0);
  _DAT_00448838 = FUN_004234f0(s_dat_MiniGame_04_balloon01_wav_00443380,5);
  _DAT_0044883c = FUN_004234f0(s_dat_MiniGame_04_balloon02_wav_00443360,5);
  _DAT_00448840 = FUN_004234f0(s_dat_MiniGame_04_balloon03_wav_00443340,5);
  return;
}
// ==== FUN_0041dca0 @ 0041dca0
void FUN_0041dca0(void)
{
  int iVar1;
  int *piVar2;
  int iVar3;
  uint uVar4;
  int iVar5;
  uint uVar6;
  int *piStack_4;
  uVar6 = 0;
  iVar5 = 0;
  piVar2 = (int *)0x448820;
  do {
    if (*piVar2 != 0) {
      iVar5 = iVar5 + 1;
    }
    piVar2 = piVar2 + 1;
  } while ((int)piVar2 < 0x448830);
  if (iVar5 == 4) {
    _DAT_00448844 = 0xf;
    return;
  }
  _DAT_00448844 = 0;
  piStack_4 = (int *)0x448820;
  do {
    if (*piStack_4 != 0) {
      iVar1 = *(int *)(*piStack_4 + 0x10);
      _DAT_00448844 = _DAT_00448844 | (ushort)(1 << ((byte)*(undefined4 *)(iVar1 + 0x10) & 0x1f));
      iVar3 = (DAT_004437b8 / iVar5) * uVar6 + DAT_004437b8 / (iVar5 * 2);
      *(int *)(iVar1 + 0x14) = iVar3;
      *(int *)(iVar1 + 0x1c) = iVar3;
      uVar4 = uVar6 & 0x80000001;
      if ((int)uVar4 < 0) {
        uVar4 = (uVar4 - 1 | 0xfffffffe) + 1;
      }
      uVar6 = uVar6 + 1;
      *(uint *)(iVar1 + 0x18) = DAT_004437bc / 2 + uVar4 * -0x14 + 10;
    }
    piStack_4 = piStack_4 + 1;
  } while ((int)piStack_4 < 0x448830);
  return;
}
// ==== FUN_0041dd60 @ 0041dd60
void FUN_0041dd60(void)
{
  int iVar1;
  int iVar2;
  func_0x004205c0();
  iVar1 = FUN_0040e970(_DAT_00448864,DAT_004437b8,4);
  iVar2 = FUN_0040e970(_DAT_00448860,DAT_004437bc,4);
  if ((iVar1 < 2) && (iVar2 < 2)) {
    FUN_00422da0(0,0,0);
    _DAT_00443300 = FUN_0041df80;
    _DAT_00443304 = FUN_0041df90;
    return;
  }
  _DAT_00448864 = _DAT_00448864 + iVar1;
  _DAT_00448860 = _DAT_00448860 + iVar2;
  return;
}
// ==== FUN_0041ddf0 @ 0041ddf0
void FUN_0041ddf0(void)
{
  int iVar1;
  int *this;
  FUN_00422da0(0,0,0);
  iVar1 = (DAT_004437bc + -0x1e0) / 2;
  FUN_00422df0(0,iVar1,DAT_004437b8 + -1,iVar1 + 0x1df);
  func_0x004205f0();
  FUN_00422df0(0,0,DAT_004437b8 + -1,DAT_004437bc + -1);
  this = FUN_00423f30(DAT_00448914);
  FUN_00424270(_DAT_00448858,0,0,0x100,0);
  FUN_00423fc0(this,(DAT_004437b8 - _DAT_00448864) / 2,(DAT_004437bc - _DAT_00448860) / 2,
               _DAT_00448864,_DAT_00448860,0x100,0);
  FUN_00423eb0(this);
  return;
}
// ==== FUN_0041deb0 @ 0041deb0
void FUN_0041deb0(void)
{
  int *piVar1;
  FUN_00423eb0(_DAT_00448858);
  piVar1 = (int *)0x448820;
  do {
    if (*piVar1 != 0) {
      FUN_00420590(_DAT_0044881c,*piVar1);
      FUN_00420500((LPVOID)*piVar1);
    }
    piVar1 = piVar1 + 1;
  } while ((int)piVar1 < 0x448830);
  FUN_00420590(_DAT_0044881c,(int)_DAT_00448834);
  FUN_00420500(_DAT_00448834);
  FUN_00420590(_DAT_0044881c,DAT_004486a0);
  func_0x00420530();
  FUN_0041df30();
  return;
}
// ==== FUN_0041df30 @ 0041df30
void FUN_0041df30(void)
{
  LPVOID pvVar1;
  FUN_00423540(_DAT_00448840);
  FUN_00423540(_DAT_0044883c);
  FUN_00423540(_DAT_00448838);
  FUN_004244e0(_DAT_0044885c);
  FUN_00420f10(_DAT_0044884c);
  FUN_00423540(_DAT_00448854);
  pvVar1 = _DAT_00448848;
  if (_DAT_00448848 != (LPVOID)0x0) {
    FUN_00436366(*(LPVOID *)((int)_DAT_00448848 + 0x10));
    FUN_00436366(pvVar1);
  }
  return;
}
// ==== FUN_0041df80 @ 0041df80
void FUN_0041df80(void)
{
  int *piVar1;
  int iVar2;
  code *pcVar3;
  int iVar4;
  iVar4 = *(int *)(_DAT_0044881c + 4);
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
// ==== FUN_0041df90 @ 0041df90
void FUN_0041df90(void)
{
  int iVar1;
  iVar1 = (DAT_004437bc + -0x1e0) / 2;
  FUN_00422df0(0,iVar1,DAT_004437b8 + -1,iVar1 + 0x1df);
  func_0x004205f0();
  FUN_00422df0(0,0,DAT_004437b8 + -1,DAT_004437bc + -1);
  return;
}
