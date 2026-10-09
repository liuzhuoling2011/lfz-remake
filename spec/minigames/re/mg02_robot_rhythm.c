// ==== FUN_0041a660 @ 0041a660
undefined4 FUN_0041a660(void)
{
  undefined4 *puVar1;
  undefined4 *puVar2;
  int iVar3;
  FUN_00420a70();
  _DAT_004487d4 = 0;
  FUN_0041b5e0();
  _DAT_00448788 = (void *)thunk_FUN_004278d0();
  FUN_00420540(_DAT_00448788,DAT_004486a0,0xffffffff);
  _DAT_004487b0 = FUN_004204a0(0,FUN_0041b0e0,FUN_0041b1e0,FUN_0041b2b0,FUN_0041b240);
  FUN_00420540(_DAT_00448788,(int)_DAT_004487b0,0);
  _DAT_004487a8 = FUN_004204a0(0,FUN_0041a7b0,FUN_0041a820,FUN_0041a850,FUN_0041a870);
  FUN_00420540(_DAT_00448788,(int)_DAT_004487a8,5);
  _DAT_004487ac = FUN_004204a0(0,FUN_0041a970,FUN_0041e5a0,FUN_0041a9d0,FUN_0041aad0);
  FUN_00420540(_DAT_00448788,(int)_DAT_004487ac,10);
  iVar3 = 0;
  puVar2 = (undefined4 *)0x448794;
  do {
    puVar1 = FUN_004204a0(iVar3,FUN_0041ab00,FUN_00404510,FUN_0041ac10,FUN_0041b080);
    *puVar2 = puVar1;
    if (puVar1 != (undefined4 *)0x0) {
      FUN_00420540(_DAT_00448788,(int)puVar1,0x14);
    }
    puVar2 = puVar2 + 1;
    iVar3 = iVar3 + 1;
  } while ((int)puVar2 < 0x4487a4);
  FUN_0041b650();
  _DAT_004487c0 = FUN_00423f30(DAT_00448914);
  _DAT_00443108 = FUN_0041b6e0;
  _DAT_0044310c = FUN_0041b770;
  _DAT_004487d0 = 0x172;
  _DAT_004487cc = 0x116;
  return 1;
}
// ==== FUN_0041a7b0 @ 0041a7b0
undefined4 FUN_0041a7b0(int param_1)
{
  undefined2 uVar1;
  undefined4 *puVar2;
  int *piVar3;
  undefined4 *puVar4;
  int iVar5;
  puVar2 = _malloc(0x1c);
  piVar3 = FUN_00420e00(s_dat_MiniGame_02_music_spr_00443110);
  *puVar2 = piVar3;
  puVar4 = FUN_004230f0();
  puVar2[1] = puVar4;
  puVar2[4] = DAT_004437b8 / 2;
  iVar5 = DAT_004437bc + -0x1e0;
  puVar2[3] = 0x28;
  puVar2[5] = iVar5 / 2 + 0x28;
  puVar2[2] = 0x28;
  uVar1 = (**(code **)(DAT_00448910 + 8))(0,0,0);
  *(undefined2 *)(puVar2 + 6) = uVar1;
  *(undefined4 **)(param_1 + 0x10) = puVar2;
  return 1;
}
// ==== FUN_0041a820 @ 0041a820
void FUN_0041a820(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00423120((LPVOID)puVar1[1]);
  FUN_00420f10((LPVOID)*puVar1);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_0041a850 @ 0041a850
void FUN_0041a850(int param_1)
{
  int iVar1;
  iVar1 = *(int *)(param_1 + 0x10);
  if (*(int *)(iVar1 + 0xc) < *(int *)(iVar1 + 8)) {
    *(int *)(iVar1 + 0xc) = *(int *)(iVar1 + 0xc) + 1;
  }
  return;
}
// ==== FUN_0041a870 @ 0041a870
void FUN_0041a870(int param_1)
{
  undefined4 *puVar1;
  undefined2 extraout_var;
  int *piVar2;
  int iVar3;
  int extraout_EDX;
  int iVar4;
  int iVar5;
  int iVar6;
  int iStack_4;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00421910((void *)*puVar1,0,puVar1[4],puVar1[5],0x100,0);
  iVar4 = puVar1[5] + -10;
  iVar6 = puVar1[4] + -0xd3;
  iStack_4 = 5;
  param_1 = puVar1[5] + -9;
  iVar3 = (puVar1[3] * 0x1a6) % (int)puVar1[2];
  iVar5 = (puVar1[3] * 0x1a6) / (int)puVar1[2] + iVar6;
  do {
    FUN_00422e70(iVar6,iVar5,iVar4,
                 CONCAT22((short)((uint)iVar3 >> 0x10),*(undefined2 *)(puVar1 + 6)),0x100);
    FUN_00422e70(iVar6,iVar5,param_1,CONCAT22(extraout_var,*(undefined2 *)(puVar1 + 6)),0x100);
    iVar4 = iVar4 + 4;
    param_1 = param_1 + 4;
    iStack_4 = iStack_4 + -1;
    iVar3 = extraout_EDX;
  } while (iStack_4 != 0);
  piVar2 = (int *)puVar1[1];
  iVar3 = 0;
  if (0 < *piVar2) {
    do {
      FUN_00421910((void *)*puVar1,1,
                   (*(int *)(piVar2[1] + iVar3 * 4) * 0x1a6) / (int)puVar1[2] + iVar6,puVar1[5],
                   0x100,0);
      piVar2 = (int *)puVar1[1];
      iVar3 = iVar3 + 1;
    } while (iVar3 < *piVar2);
  }
  return;
}
// ==== FUN_0041a970 @ 0041a970
undefined4 FUN_0041a970(int param_1)
{
  int iVar1;
  undefined4 *puVar2;
  int *piVar3;
  void *pvVar4;
  puVar2 = _malloc(0x20);
  piVar3 = FUN_00420e00(s_dat_MiniGame_02_robot_spr_0044314c);
  *puVar2 = piVar3;
  pvVar4 = FUN_004234f0(s_dat_MiniGame_02_computer_wav_0044312c,2);
  puVar2[1] = pvVar4;
  puVar2[2] = 0;
  puVar2[3] = DAT_004437b8 / 2;
  iVar1 = DAT_004437bc;
  puVar2[6] = 0;
  puVar2[5] = 3;
  puVar2[4] = iVar1 / 2 + 0x32;
  *(undefined4 **)(param_1 + 0x10) = puVar2;
  return 1;
}
// ==== FUN_0041a9d0 @ 0041a9d0
void FUN_0041a9d0(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  switch(*(undefined4 *)(iVar1 + 0x14)) {
  case 0:
    *(undefined4 *)(iVar1 + 8) = *(undefined4 *)(iRam004430e0 + *(int *)(iVar1 + 8) * 4);
    return;
  case 1:
    iVar2 = *(int *)(iRam004430e4 + *(int *)(iVar1 + 8) * 4);
    *(int *)(iVar1 + 8) = iVar2;
    if (iVar2 == 2) {
      FUN_004235b0(_DAT_004487c8,0xff,0x80,0,'\0');
    }
    if (*(int *)(iVar1 + 8) == 0) {
      *(undefined4 *)(iVar1 + 0x14) = 0;
      return;
    }
    break;
  case 2:
    iVar2 = *(int *)(iVar1 + 0x18) + 1;
    *(int *)(iVar1 + 0x18) = iVar2;
    if (5 < iVar2) {
      *(undefined4 *)(iVar1 + 0x18) = 0;
      *(undefined4 *)(iVar1 + 8) = *(undefined4 *)(iRam004430e8 + *(int *)(iVar1 + 8) * 4);
    }
    if (*(int *)(iVar1 + 8) == 3) {
      iVar2 = FUN_004235b0(*(void **)(iVar1 + 4),0x80,0x80,1,'\x01');
      *(int *)(iVar1 + 0x1c) = iVar2;
      *(undefined4 *)(iVar1 + 8) = 0;
      *(undefined4 *)(iVar1 + 0x14) = 0;
    }
    break;
  case 3:
    iVar2 = *(int *)(iVar1 + 0x18) + 1;
    *(int *)(iVar1 + 0x18) = iVar2;
    if (10 < iVar2) {
      *(undefined4 *)(iVar1 + 0x18) = 0;
      *(undefined4 *)(iVar1 + 8) = *(undefined4 *)(iRam004430ec + *(int *)(iVar1 + 8) * 4);
      return;
    }
  }
  return;
}
// ==== FUN_0041aad0 @ 0041aad0
void FUN_0041aad0(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00421910((void *)*puVar1,*(int *)(*(int *)(puVar1[5] * 4 + 0x4430f0) + puVar1[2] * 4),
               puVar1[3],puVar1[4],0x100,0);
  return;
}
// ==== FUN_0041ab00 @ 0041ab00
uint FUN_0041ab00(int param_1,int param_2)
{
  int iVar1;
  uint uVar2;
  int iVar3;
  int *piVar4;
  int *piVar5;
  CHAR aCStack_100 [256];
  iVar1 = *(int *)(*(int *)(DAT_004488bc + 4) + param_2 * 4);
  uVar2 = *(uint *)(iVar1 + 0x34);
  if ((((uVar2 != 0xffffffff) && (uVar2 != 1)) && (uVar2 != 2)) && (uVar2 != 5)) {
    piVar4 = _malloc(0x2c);
    FUN_00436395(aCStack_100,(byte *)s_dat_MiniGame_02_player_02d_spr_00443168);
    piVar5 = FUN_00420e00(aCStack_100);
    *piVar4 = (int)piVar5;
    iVar1 = *(int *)(iVar1 + 0x1c);
    piVar4[2] = iVar1;
    FUN_00426ad0(iVar1);
    piVar4[3] = param_2;
    piVar4[4] = ((int)(DAT_004437b8 + (DAT_004437b8 >> 0x1f & 3U)) >> 2) * param_2 +
                ((int)(DAT_004437b8 + (DAT_004437b8 >> 0x1f & 7U)) >> 3);
    iVar3 = DAT_004437bc;
    iVar1 = *(int *)(**(int **)(*piVar4 + 0xc) + 4);
    piVar4[7] = 1;
    piVar4[5] = (-(iVar1 / 2) - (iVar3 + -0x1e0) / 2) + iVar3;
    piVar4[6] = 0;
    piVar4[10] = 0;
    piVar4[1] = 0;
    *(undefined1 *)(piVar4 + 9) = 0;
    piVar4[8] = 0;
    *(undefined1 *)((int)piVar4 + 0x25) = 0;
    *(int **)(param_1 + 0x10) = piVar4;
    return 1;
  }
  return uVar2 & 0xffffff00;
}
// ==== FUN_0041ac10 @ 0041ac10
void FUN_0041ac10(int param_1)
{
  int *piVar1;
  int iVar2;
  byte *pbVar3;
  piVar1 = *(int **)(param_1 + 0x10);
  if (*(char *)(*(int *)(*(int *)(DAT_004488bc + 4) + piVar1[3] * 4) + 0x3c) == '\0') {
    pbVar3 = (byte *)FUN_00426a80(piVar1[2]);
    if (((pbVar3 == (byte *)0x0) || (pbVar3[1] != 1)) || (1 < *pbVar3)) {
      iVar2 = piVar1[6];
      piVar1[6] = iVar2 + piVar1[7];
      if (iVar2 + piVar1[7] < -10) {
        piVar1[7] = 1;
      }
      if (2 < piVar1[6]) {
        piVar1[7] = -1;
      }
      return;
    }
  }
  _DAT_004487d4 = _DAT_004487d4 | (ushort)(1 << ((byte)piVar1[3] & 0x1f));
  *(code **)(param_1 + 8) = FUN_0041ada0;
  *(code **)(param_1 + 0xc) = FUN_0041acc0;
  piVar1[6] = *(int *)(**(int **)(*piVar1 + 0xc) + 4);
  FUN_004235b0(_DAT_004487bc,0x80,0x80,0,'\0');
  return;
}
// ==== FUN_0041acc0 @ 0041acc0
void FUN_0041acc0(int param_1)
{
  int iVar1;
  iVar1 = *(int *)(param_1 + 0x10);
  FUN_00421910(_DAT_004487a4,*(int *)(iVar1 + 4),*(int *)(iVar1 + 0x10),
               *(int *)(iVar1 + 0x18) + *(int *)(iVar1 + 0x14),0x100,0);
  FUN_0041ad00(iVar1);
  return;
}
// ==== FUN_0041ad00 @ 0041ad00
void FUN_0041ad00(undefined4 *param_1)
{
  uint uVar1;
  byte abStack_c [12];
  FUN_00421910((void *)*param_1,0,param_1[4],param_1[5],0x100,0);
  FUN_00436395(abStack_c,&DAT_00442574);
  uVar1 = FUN_00424560((int)_DAT_004487c4,abStack_c);
  *(undefined1 *)((int)_DAT_004487c4 + 0xd) = 0;
  FUN_00424500(_DAT_004487c4,0,0,0);
  FUN_00424600((int)_DAT_004487c4,(param_1[4] - (uVar1 >> 1)) + 0x1c,(byte *)(param_1[5] + -0xd),0,
               abStack_c);
  return;
}
// ==== FUN_0041ada0 @ 0041ada0
void FUN_0041ada0(int param_1)
{
  int iVar1;
  iVar1 = *(int *)(param_1 + 0x10);
  if ((ushort)((ushort)(1 << ((byte)*(undefined4 *)(iVar1 + 0xc) & 0x1f)) & (ushort)_DAT_004487d4)
      == 0) {
    *(code **)(param_1 + 8) = FUN_0041ade0;
  }
  if (3 < *(int *)(iVar1 + 0x18)) {
    *(int *)(iVar1 + 0x18) = *(int *)(iVar1 + 0x18) + -3;
    return;
  }
  *(undefined4 *)(iVar1 + 0x18) = 0;
  return;
}
// ==== FUN_0041ade0 @ 0041ade0
void FUN_0041ade0(int param_1)
{
  int iVar1;
  iVar1 = *(int *)(param_1 + 0x10);
  if ((ushort)((ushort)(1 << ((byte)*(undefined4 *)(iVar1 + 0xc) & 0x1f)) & (ushort)_DAT_004487d4)
      != 0) {
    *(code **)(param_1 + 8) = FUN_0041ae50;
    *(code **)(param_1 + 0xc) = FUN_0041acc0;
    if (*(char *)(*(int *)(*(int *)(DAT_004488bc + 4) + *(int *)(iVar1 + 0xc) * 4) + 0x3c) == '\0')
    {
      FUN_00426ad0(*(int *)(iVar1 + 8));
    }
    *(undefined4 *)(iVar1 + 0x18) = 0;
  }
  if (3 < *(int *)(iVar1 + 0x18)) {
    *(int *)(iVar1 + 0x18) = *(int *)(iVar1 + 0x18) + -3;
    return;
  }
  *(undefined4 *)(iVar1 + 0x18) = 0;
  return;
}
// ==== FUN_0041ae50 @ 0041ae50
void FUN_0041ae50(int param_1)
{
  int iVar1;
  char *pcVar2;
  int iVar3;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar3 = *(int *)(*(int *)(DAT_004488bc + 4) + *(int *)(iVar1 + 0xc) * 4);
  if (DAT_00448790 == '\0') {
    *(undefined1 *)(iVar1 + 0x25) = 1;
    *(undefined1 *)(iVar1 + 0x24) = 0;
    *(undefined4 *)(iVar1 + 4) = 0;
  }
  if (*(char *)(iVar3 + 0x3c) == '\0') {
    pcVar2 = (char *)FUN_00426a80(*(int *)(iVar1 + 8));
    if (DAT_00448790 == '\0') {
      return;
    }
    if ((pcVar2 != (char *)0x0) && (*pcVar2 == '\0')) {
      if (pcVar2[1] == '\0') {
        *(undefined1 *)(iVar1 + 0x24) = 1;
        iVar3 = FUN_0041af40(iVar1 + 0x28);
        *(int *)(iVar1 + 0x20) = *(int *)(iVar1 + 0x20) + iVar3;
        FUN_004235b0(_DAT_004487c8,0xff,(*(int *)(iVar1 + 0x10) * 0xff) / DAT_004437b8,0,'\0');
      }
      if (pcVar2[1] == '\x01') {
        *(undefined1 *)(iVar1 + 0x24) = 0;
      }
    }
  }
  else {
    FUN_0041afc0(iVar1);
  }
  if (*(char *)(iVar1 + 0x25) != '\0') {
    *(undefined1 *)(iVar1 + 0x25) = 0;
    *(undefined4 *)(iVar1 + 0x28) = 0;
  }
  iVar3 = *(int *)(iVar1 + 4);
  if (*(char *)(iVar1 + 0x24) == '\0') {
    if ((0 < iVar3) && (*(int *)(iVar1 + 4) = iVar3 + 1, iVar3 + 1 == *_DAT_004487a4 + -1)) {
      *(undefined4 *)(iVar1 + 4) = 0;
    }
  }
  else if (iVar3 < 3) {
    *(int *)(iVar1 + 4) = iVar3 + 1;
    return;
  }
  return;
}
// ==== FUN_0041af40 @ 0041af40
int FUN_0041af40(int *param_1)
{
  int iVar1;
  uint uVar2;
  int iVar3;
  int iVar4;
  uint uVar5;
  int *piVar6;
  int iVar7;
  int iVar8;
  iVar4 = *param_1;
  iVar7 = -1;
  piVar6 = *(int **)(*(int *)(_DAT_004487a8 + 0x10) + 4);
  iVar8 = 10;
  iVar1 = *piVar6;
  if (iVar1 <= iVar4) {
    return 0;
  }
  piVar6 = (int *)(piVar6[1] + iVar4 * 4);
  do {
    uVar2 = *piVar6 - *(int *)(*(int *)(_DAT_004487a8 + 0x10) + 0xc);
    uVar5 = (int)uVar2 >> 0x1f;
    iVar3 = (uVar2 ^ uVar5) - uVar5;
    if (iVar3 < iVar8) {
      iVar7 = iVar4;
      iVar8 = iVar3;
    }
    iVar4 = iVar4 + 1;
    piVar6 = piVar6 + 1;
  } while (iVar4 < iVar1);
  if (iVar7 == -1) {
    return 0;
  }
  *param_1 = iVar7 + 1;
  return 10 - iVar8;
}
// ==== FUN_0041afc0 @ 0041afc0
void FUN_0041afc0(int param_1)
{
  int *piVar1;
  int *piVar2;
  uint uVar3;
  int iVar4;
  uint uVar5;
  bool bVar6;
  if (DAT_00448790 != '\0') {
    if (*(char *)(param_1 + 0x24) != '\0') {
      *(undefined1 *)(param_1 + 0x24) = 0;
      return;
    }
    iVar4 = *(int *)(_DAT_004487a8 + 0x10);
    uVar3 = FUN_00436815();
    uVar3 = uVar3 & 0x80000001;
    bVar6 = uVar3 == 0;
    if ((int)uVar3 < 0) {
      bVar6 = (uVar3 - 1 | 0xfffffffe) == 0xffffffff;
    }
    if (bVar6) {
      piVar2 = *(int **)(iVar4 + 4);
      piVar1 = (int *)(param_1 + 0x28);
      if (*(int *)(param_1 + 0x28) < *piVar2) {
        uVar5 = *(int *)(iVar4 + 0xc) - *(int *)(piVar2[1] + *(int *)(param_1 + 0x28) * 4);
        uVar3 = FUN_00436815();
        if ((int)((uVar5 ^ (int)uVar5 >> 0x1f) - ((int)uVar5 >> 0x1f)) < (int)uVar3 % 5 + 4) {
          *(undefined1 *)(param_1 + 0x24) = 1;
          iVar4 = FUN_0041af40(piVar1);
          *(int *)(param_1 + 0x20) = *(int *)(param_1 + 0x20) + iVar4;
          FUN_004235b0(_DAT_004487c8,0xff,(*(int *)(param_1 + 0x10) * 0xff) / DAT_004437b8,0,'\0');
          return;
        }
        if (0 < (int)uVar5) {
          *piVar1 = *piVar1 + 1;
        }
      }
    }
  }
  return;
}
// ==== FUN_0041b080 @ 0041b080
void FUN_0041b080(int param_1)
{
  int iVar1;
  int iVar2;
  int iVar3;
  iVar1 = *(int *)(param_1 + 0x10);
  FUN_0041ad00(iVar1);
  iVar2 = *(int *)(iVar1 + 0x10);
  iVar3 = *(int *)(iVar1 + 0x14) + -0x1e;
  FUN_00421910(_DAT_004487b8,1,iVar2,iVar3,0x100,0);
  FUN_00421910(_DAT_004487b8,0,iVar2,*(int *)(iVar1 + 0x18) + iVar3,0x100,0);
  return;
}
// ==== FUN_0041b0e0 @ 0041b0e0
undefined4 FUN_0041b0e0(int param_1)
{
  int iVar1;
  char cVar2;
  void *pvVar3;
  int *piVar4;
  undefined4 *puVar5;
  void *this;
  uint uVar6;
  byte *pbVar7;
  undefined4 uVar8;
  void *this_00;
  int iVar9;
  int iVar10;
  int iStack_4;
  pvVar3 = _malloc(0x20);
  piVar4 = FUN_00420e00(s_dat_MiniGame_02_bg_spr_004431a4);
  *(int **)((int)pvVar3 + 8) = piVar4;
  *(int *)((int)pvVar3 + 0xc) = DAT_004437b8 / 2;
  iVar10 = DAT_004437bc;
  *(undefined4 *)((int)pvVar3 + 0x14) = 0;
  *(int *)((int)pvVar3 + 0x10) = iVar10 / 2;
  *(undefined4 *)((int)pvVar3 + 0x18) = 0;
  puVar5 = FUN_004230f0();
  *(undefined4 **)((int)pvVar3 + 4) = puVar5;
  this = FUN_00425520(s_dat_MiniGame_02_data_txt_00443188);
  iStack_4 = 0;
  uVar6 = FUN_00425800(this,0);
  cVar2 = (char)uVar6;
  while (cVar2 != '\0') {
    piVar4 = FUN_004230f0();
    iVar10 = 0;
    while( true ) {
      pbVar7 = (byte *)FUN_004258d0(this,iVar10,0);
      iVar10 = iVar10 + 1;
      if (pbVar7 == (byte *)0x0) break;
      uVar8 = FUN_004367b0(this_00,pbVar7);
      FUN_00423140(piVar4,uVar8);
    }
    iVar9 = 1;
    iVar10 = 0;
    if (1 < *piVar4) {
      do {
        iVar1 = iVar9 * 4;
        iVar10 = iVar10 + *(int *)(piVar4[1] + iVar9 * 4);
        iVar9 = iVar9 + 1;
        *(int *)(piVar4[1] + iVar1) = iVar10;
      } while (iVar9 < *piVar4);
    }
    FUN_00423140(*(void **)((int)pvVar3 + 4),piVar4);
    iStack_4 = iStack_4 + 1;
    uVar6 = FUN_00425800(this,iStack_4);
    cVar2 = (char)uVar6;
  }
  FUN_00425710(this);
  *(void **)(param_1 + 0x10) = pvVar3;
  return 1;
}
// ==== FUN_0041b1e0 @ 0041b1e0
void FUN_0041b1e0(int param_1)
{
  LPVOID pvVar1;
  int *piVar2;
  int iVar3;
  pvVar1 = *(LPVOID *)(param_1 + 0x10);
  FUN_00420590(_DAT_00448788,*(int *)((int)pvVar1 + 0x1c));
  FUN_00420500(*(LPVOID *)((int)pvVar1 + 0x1c));
  piVar2 = *(int **)((int)pvVar1 + 4);
  iVar3 = 0;
  if (0 < *piVar2) {
    do {
      FUN_00423120(*(LPVOID *)(piVar2[1] + iVar3 * 4));
      piVar2 = *(int **)((int)pvVar1 + 4);
      iVar3 = iVar3 + 1;
    } while (iVar3 < *piVar2);
  }
  FUN_00423120(*(LPVOID *)((int)pvVar1 + 4));
  FUN_00420f10(*(LPVOID *)((int)pvVar1 + 8));
  FUN_00436366(pvVar1);
  return;
}
// ==== FUN_0041b240 @ 0041b240
void FUN_0041b240(int param_1)
{
  int iVar1;
  iVar1 = *(int *)(param_1 + 0x10);
  FUN_00421910(*(void **)(iVar1 + 8),0,*(int *)(iVar1 + 0xc),*(int *)(iVar1 + 0x10),0x100,0);
  if (0x280 < DAT_004437b8) {
    FUN_00421910(*(void **)(iVar1 + 8),0,*(int *)(iVar1 + 0xc) + -0x280,*(int *)(iVar1 + 0x10),0x100
                 ,0);
    FUN_00421910(*(void **)(iVar1 + 8),0,*(int *)(iVar1 + 0xc) + 0x280,*(int *)(iVar1 + 0x10),0x100,
                 0);
  }
  return;
}
// ==== FUN_0041b2b0 @ 0041b2b0
void FUN_0041b2b0(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  if (_DAT_004487d4 == _DAT_004487b4) {
    iVar2 = FUN_0041e4c0(0);
    *(int *)(iVar1 + 0x1c) = iVar2;
    FUN_00420540(_DAT_00448788,iVar2,100);
    *(code **)(param_1 + 8) = FUN_0041b300;
    _DAT_004487d4 = 0;
  }
  return;
}
// ==== FUN_0041b300 @ 0041b300
void FUN_0041b300(int param_1)
{
  int iVar1;
  char cVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  cVar2 = FUN_0041e8b0(*(undefined4 *)(iVar1 + 0x1c));
  if (cVar2 != '\0') {
    FUN_00420590(_DAT_00448788,*(int *)(iVar1 + 0x1c));
    FUN_00420500(*(LPVOID *)(iVar1 + 0x1c));
    *(code **)(param_1 + 8) = FUN_0041b3f0;
    FUN_0041b360(iVar1);
    _DAT_004487d4 = _DAT_004487b4;
  }
  return;
}
// ==== FUN_0041b360 @ 0041b360
void FUN_0041b360(int *param_1)
{
  int iVar1;
  uint uVar2;
  uVar2 = FUN_00436815();
  uVar2 = uVar2 & 0x80000003;
  if ((int)uVar2 < 0) {
    uVar2 = (uVar2 - 1 | 0xfffffffc) + 1;
  }
  iVar1 = *(int *)(*(int *)(param_1[1] + 4) + (uVar2 + param_1[6] * 4) * 4);
  *param_1 = iVar1;
  FUN_0041b3b0(**(undefined4 **)(iVar1 + 4));
  param_1[5] = 0;
  param_1[6] = param_1[6] + 1;
  return;
}
// ==== FUN_0041b3b0 @ 0041b3b0
void FUN_0041b3b0(undefined4 param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(_DAT_004487ac + 0x10);
  iVar2 = *(int *)(_DAT_004487a8 + 0x10);
  *(undefined4 *)(iVar2 + 0xc) = 0;
  *(undefined4 *)(iVar2 + 8) = param_1;
  FUN_00423200(*(undefined4 **)(iVar2 + 4));
  *(undefined4 *)(iVar1 + 0x14) = 2;
  *(undefined4 *)(iVar1 + 8) = 0;
  DAT_00448790 = 0;
  return;
}
// ==== FUN_0041b3f0 @ 0041b3f0
void FUN_0041b3f0(int param_1)
{
  undefined4 *puVar1;
  int *piVar2;
  int iVar3;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  iVar3 = puVar1[5];
  puVar1[5] = iVar3 + 1;
  piVar2 = (int *)*puVar1;
  if (iVar3 + 1 == *(int *)piVar2[1]) {
    FUN_0041b480();
    puVar1[5] = 0;
    *(code **)(param_1 + 8) = FUN_0041b4c0;
    return;
  }
  iVar3 = 1;
  if (1 < *piVar2) {
    do {
      if (puVar1[5] == *(int *)(piVar2[1] + iVar3 * 4)) {
        FUN_0041b450();
      }
      piVar2 = (int *)*puVar1;
      iVar3 = iVar3 + 1;
    } while (iVar3 < *piVar2);
  }
  return;
}
// ==== FUN_0041b450 @ 0041b450
void FUN_0041b450(void)
{
  int iVar1;
  iVar1 = *(int *)(_DAT_004487ac + 0x10);
  FUN_00423140(*(void **)(*(int *)(_DAT_004487a8 + 0x10) + 4),
               *(undefined4 *)(*(int *)(_DAT_004487a8 + 0x10) + 0xc));
  *(undefined4 *)(iVar1 + 0x14) = 1;
  *(undefined4 *)(iVar1 + 8) = 0;
  return;
}
// ==== FUN_0041b480 @ 0041b480
void FUN_0041b480(void)
{
  int iVar1;
  iVar1 = *(int *)(_DAT_004487ac + 0x10);
  *(undefined4 *)(*(int *)(_DAT_004487a8 + 0x10) + 0xc) = 0;
  *(undefined4 *)(iVar1 + 0x14) = 3;
  FUN_004236a0(*(int *)(iVar1 + 0x1c));
  *(undefined4 *)(iVar1 + 8) = 0;
  DAT_00448790 = 1;
  return;
}
// ==== FUN_0041b4c0 @ 0041b4c0
void FUN_0041b4c0(int param_1)
{
  int *piVar1;
  int iVar2;
  piVar1 = *(int **)(param_1 + 0x10);
  iVar2 = piVar1[5];
  piVar1[5] = iVar2 + 1;
  if (iVar2 + 1 == **(int **)(*piVar1 + 4)) {
    if (piVar1[6] == 5) {
      _DAT_004487d4 = 0;
      iVar2 = FUN_0041e4c0(2);
      piVar1[7] = iVar2;
      FUN_00420540(_DAT_00448788,iVar2,100);
      *(code **)(param_1 + 8) = FUN_0041b530;
      return;
    }
    *(code **)(param_1 + 8) = FUN_0041b3f0;
    FUN_0041b360(piVar1);
  }
  return;
}
// ==== FUN_0041b530 @ 0041b530
void FUN_0041b530(int param_1)
{
  int iVar1;
  char cVar2;
  int iVar3;
  iVar1 = *(int *)(param_1 + 0x10);
  cVar2 = FUN_0041e8b0(*(undefined4 *)(iVar1 + 0x1c));
  if (cVar2 != '\0') {
    FUN_00420590(_DAT_00448788,*(int *)(iVar1 + 0x1c));
    FUN_00420500(*(LPVOID *)(iVar1 + 0x1c));
    iVar3 = 0;
    do {
      if (*(int *)(iVar3 + 0x448794) == 0) {
        *(undefined4 *)(iVar3 + 0x443048) = 0xffffffff;
      }
      else {
        *(undefined4 *)(iVar3 + 0x443048) =
             *(undefined4 *)(*(int *)(*(int *)(iVar3 + 0x448794) + 0x10) + 0x20);
      }
      iVar3 = iVar3 + 4;
    } while (iVar3 < 0x10);
    iVar3 = FUN_0041e8c0(0x443048);
    *(int *)(iVar1 + 0x1c) = iVar3;
    FUN_00420540(_DAT_00448788,iVar3,100);
    *(code **)(param_1 + 8) = FUN_0041b5c0;
  }
  return;
}
// ==== FUN_0041b5c0 @ 0041b5c0
void FUN_0041b5c0(int param_1)
{
  char cVar1;
  cVar1 = FUN_0041ee10(*(undefined4 *)(*(int *)(param_1 + 0x10) + 0x1c));
  if (cVar1 == '\0') {
    return;
  }
  if (0 < DAT_00448c50) {
    DAT_004437c8 = *(undefined4 *)(DAT_00448c50 * 8 + 0x44892c);
    DAT_00448c50 = DAT_00448c50 + -1;
    if (*(int *)(&DAT_00448930 + DAT_00448c50 * 8) != 0) {
      DAT_00448c5b = 0;
      DAT_00448c59 = 1;
      DAT_00448c5a = 1;
      _DAT_00448c5c = *(int *)(&DAT_00448930 + DAT_00448c50 * 8);
      return;
    }
  }
  DAT_00448c58 = 1;
  return;
}
// ==== FUN_0041b5e0 @ 0041b5e0
void FUN_0041b5e0(void)
{
  _DAT_0044878c = FUN_00425520(s_dat_MiniGame_02_data_txt_00443188);
  _DAT_004487a4 = FUN_00420e00(s_dat_MiniGame_02_hand_spr_004431d4);
  _DAT_004487b8 = FUN_00420e00(s_dat_MiniGame_pressbutton_spr_00442f20);
  _DAT_004487bc = FUN_004234f0(s_dat_MiniGame_drip_wav_00442eb0,4);
  _DAT_004487c4 = FUN_00424430(s_dat_MiniGame_01_number_fnt_00442fe0,0);
  _DAT_004487c8 = FUN_004234f0(s_dat_MiniGame_02_kk_wav_004431bc,10);
  return;
}
// ==== FUN_0041b650 @ 0041b650
void FUN_0041b650(void)
{
  int iVar1;
  int *piVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int *piStack_4;
  iVar5 = 0;
  iVar4 = 0;
  piVar2 = (int *)0x448794;
  do {
    if (*piVar2 != 0) {
      iVar4 = iVar4 + 1;
    }
    piVar2 = piVar2 + 1;
  } while ((int)piVar2 < 0x4487a4);
  if (iVar4 == 4) {
    _DAT_004487b4 = 0xf;
    return;
  }
  _DAT_004487b4 = 0;
  piStack_4 = (int *)0x448794;
  do {
    if (*piStack_4 != 0) {
      iVar1 = *(int *)(*piStack_4 + 0x10);
      _DAT_004487b4 = _DAT_004487b4 | (ushort)(1 << ((byte)*(undefined4 *)(iVar1 + 0xc) & 0x1f));
      iVar3 = (DAT_004437b8 / iVar4) * iVar5;
      iVar5 = iVar5 + 1;
      *(int *)(iVar1 + 0x10) = DAT_004437b8 / (iVar4 * 2) + iVar3;
    }
    piStack_4 = piStack_4 + 1;
  } while ((int)piStack_4 < 0x4487a4);
  return;
}
// ==== FUN_0041b6e0 @ 0041b6e0
void FUN_0041b6e0(void)
{
  int iVar1;
  int iVar2;
  func_0x004205c0();
  iVar1 = FUN_0040e970(_DAT_004487d0,DAT_004437b8,4);
  iVar2 = FUN_0040e970(_DAT_004487cc,DAT_004437bc,4);
  if ((iVar1 < 2) && (iVar2 < 2)) {
    FUN_00422da0(0,0,0);
    _DAT_00443108 = FUN_0041b930;
    _DAT_0044310c = FUN_0041b940;
    return;
  }
  _DAT_004487d0 = _DAT_004487d0 + iVar1;
  _DAT_004487cc = _DAT_004487cc + iVar2;
  return;
}
// ==== FUN_0041b770 @ 0041b770
void FUN_0041b770(void)
{
  int iVar1;
  int *this;
  FUN_00422da0(0,0,0);
  iVar1 = (DAT_004437bc + -0x1e0) / 2;
  FUN_00422df0(0,iVar1,DAT_004437b8 + -1,iVar1 + 0x1df);
  func_0x004205f0();
  FUN_00422df0(0,0,DAT_004437b8 + -1,DAT_004437bc + -1);
  this = FUN_00423f30(DAT_00448914);
  FUN_00424270(_DAT_004487c0,0,0,0x100,0);
  FUN_00423fc0(this,(DAT_004437b8 - _DAT_004487d0) / 2,(DAT_004437bc - _DAT_004487cc) / 2,
               _DAT_004487d0,_DAT_004487cc,0x100,0);
  FUN_00423eb0(this);
  return;
}
// ==== FUN_0041b830 @ 0041b830
void FUN_0041b830(void)
{
  int *piVar1;
  FUN_00423eb0(_DAT_004487c0);
  FUN_00420590(_DAT_00448788,DAT_004486a0);
  piVar1 = (int *)0x448794;
  do {
    if (*piVar1 != 0) {
      FUN_00420590(_DAT_00448788,*piVar1);
      FUN_00420500((LPVOID)*piVar1);
    }
    piVar1 = piVar1 + 1;
  } while ((int)piVar1 < 0x4487a4);
  FUN_00420590(_DAT_00448788,(int)_DAT_004487a8);
  FUN_00420500(_DAT_004487a8);
  FUN_00420590(_DAT_00448788,(int)_DAT_004487ac);
  FUN_00420500(_DAT_004487ac);
  FUN_00420590(_DAT_00448788,(int)_DAT_004487b0);
  FUN_00420500(_DAT_004487b0);
  func_0x00420530();
  FUN_0041b8e0();
  return;
}
// ==== FUN_0041b8e0 @ 0041b8e0
void FUN_0041b8e0(void)
{
  undefined4 *puVar1;
  LPVOID pvVar2;
  int *piVar3;
  int iVar4;
  FUN_00423540(_DAT_004487c8);
  FUN_004244e0(_DAT_004487c4);
  FUN_00423540(_DAT_004487bc);
  FUN_00420f10(_DAT_004487b8);
  FUN_00420f10(_DAT_004487a4);
  pvVar2 = _DAT_0044878c;
  if (_DAT_0044878c != (LPVOID)0x0) {
    piVar3 = *(int **)((int)_DAT_0044878c + 0x10);
    iVar4 = *piVar3;
    while (0 < iVar4) {
      iVar4 = 0;
      puVar1 = *(undefined4 **)piVar3[1];
      piVar3 = (int *)*puVar1;
      if (0 < *piVar3) {
        do {
          FUN_00436366(*(LPVOID *)(piVar3[1] + iVar4 * 4));
          piVar3 = (int *)*puVar1;
          iVar4 = iVar4 + 1;
        } while (iVar4 < *piVar3);
      }
      FUN_00423120((LPVOID)*puVar1);
      FUN_00436366(puVar1);
      FUN_00423190(*(void **)((int)pvVar2 + 0x10),0);
      piVar3 = *(int **)((int)pvVar2 + 0x10);
      iVar4 = *piVar3;
    }
    FUN_00423120(*(LPVOID *)((int)pvVar2 + 0x10));
    FUN_00436366(*(LPVOID *)((int)pvVar2 + 0xc));
    FUN_00436366(pvVar2);
  }
  return;
}
// ==== FUN_0041b930 @ 0041b930
void FUN_0041b930(void)
{
  int *piVar1;
  int iVar2;
  code *pcVar3;
  int iVar4;
  iVar4 = *(int *)(_DAT_00448788 + 4);
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
// ==== FUN_0041b940 @ 0041b940
void FUN_0041b940(void)
{
  int iVar1;
  iVar1 = (DAT_004437bc + -0x1e0) / 2;
  FUN_00422df0(0,iVar1,DAT_004437b8 + -1,iVar1 + 0x1df);
  func_0x004205f0();
  FUN_00422df0(0,0,DAT_004437b8 + -1,DAT_004437bc + -1);
  return;
}
