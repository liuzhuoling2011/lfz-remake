// ==== FUN_0041b990 @ 0041b990
undefined4 FUN_0041b990(void)
{
  undefined4 *puVar1;
  undefined4 *puVar2;
  int iVar3;
  FUN_00420a70();
  FUN_0041ccd0();
  _DAT_004487d8 = (void *)thunk_FUN_004278d0();
  FUN_00420540(_DAT_004487d8,DAT_004486a0,0xffffffff);
  _DAT_004487f0 = FUN_004204a0(0,FUN_0041c750,FUN_0041c820,FUN_0041ca90,FUN_0041c860);
  FUN_00420540(_DAT_004487d8,(int)_DAT_004487f0,0);
  _DAT_00448804 = FUN_004204a0(0,FUN_0041baa0,FUN_0041bb50,FUN_0041bb90,FUN_0041bd50);
  FUN_00420540(_DAT_004487d8,(int)_DAT_00448804,5);
  iVar3 = 0;
  puVar2 = (undefined4 *)0x4487dc;
  do {
    puVar1 = FUN_004204a0(iVar3,FUN_0041bdc0,FUN_00404510,FUN_0041bf00,FUN_0041c6e0);
    *puVar2 = puVar1;
    if (puVar1 != (undefined4 *)0x0) {
      FUN_00420540(_DAT_004487d8,(int)puVar1,10);
    }
    puVar2 = puVar2 + 1;
    iVar3 = iVar3 + 1;
  } while ((int)puVar2 < 0x4487ec);
  FUN_0041cd30();
  _DAT_00448808 = FUN_00423f30(DAT_00448914);
  _DAT_00443208 = FUN_0041ce10;
  _DAT_0044320c = FUN_0041cea0;
  _DAT_00448814 = 0x172;
  _DAT_00448810 = 0x116;
  return 1;
}
// ==== FUN_0041baa0 @ 0041baa0
undefined4 FUN_0041baa0(int param_1)
{
  undefined4 *puVar1;
  int iVar2;
  int *piVar3;
  void *pvVar4;
  undefined4 *puVar5;
  CHAR aCStack_100 [256];
  puVar1 = _malloc(0x38);
  iVar2 = 0;
  puVar5 = puVar1;
  do {
    iVar2 = iVar2 + 1;
    FUN_00436395(aCStack_100,(byte *)s_dat_MiniGame_03_thief__02d_spr_0044322c);
    piVar3 = FUN_00420e00(aCStack_100);
    *puVar5 = piVar3;
    puVar5 = puVar5 + 1;
  } while (iVar2 < 5);
  pvVar4 = FUN_004234f0(s_dat_MiniGame_03_barf_wav_00443210,2);
  puVar1[6] = pvVar4;
  *(undefined1 *)(puVar1 + 0xd) = 0;
  puVar1[7] = DAT_004437b8 / 2;
  iVar2 = DAT_004437bc / 2;
  puVar1[5] = puVar1[3];
  puVar1[8] = iVar2 + 100;
  puVar1[0xb] = 0;
  puVar1[0xc] = 4;
  puVar1[10] = 0;
  *(undefined4 **)(param_1 + 0x10) = puVar1;
  return 1;
}
// ==== FUN_0041bb50 @ 0041bb50
void FUN_0041bb50(int param_1)
{
  undefined4 *puVar1;
  undefined4 *puVar2;
  int iVar3;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  iVar3 = 5;
  puVar2 = puVar1;
  do {
    FUN_00420f10((LPVOID)*puVar2);
    puVar2 = puVar2 + 1;
    iVar3 = iVar3 + -1;
  } while (iVar3 != 0);
  FUN_00423540((LPVOID)puVar1[6]);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_0041bb90 @ 0041bb90
void FUN_0041bb90(int param_1)
{
  int iVar1;
  uint uVar2;
  int iVar3;
  bool bVar4;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar3 = *(int *)(iVar1 + 0x2c) + 1;
  *(int *)(iVar1 + 0x2c) = iVar3;
  if (*(int *)(iVar1 + 0x30) <= iVar3) {
    *(undefined4 *)(iVar1 + 0x2c) = 0;
    if (DAT_004437b8 - DAT_004437b8 / 3 < *(int *)(iVar1 + 0x1c)) {
      uVar2 = FUN_00436815();
      uVar2 = uVar2 & 0x80000003;
      bVar4 = uVar2 == 0;
      if ((int)uVar2 < 0) {
        bVar4 = (uVar2 - 1 | 0xfffffffc) == 0xffffffff;
      }
      if (bVar4) goto LAB_0041bbfa;
    }
    iVar3 = *(int *)(iVar1 + 0x1c) + 0x10;
    *(int *)(iVar1 + 0x1c) = iVar3;
    if (DAT_004437b8 + -100 < iVar3) {
LAB_0041bbfa:
      *(undefined4 *)(iVar1 + 0x24) = 1;
      *(code **)(param_1 + 8) = FUN_0041bc50;
      FUN_0041bc30(iVar1,3);
      return;
    }
    iVar3 = *(int *)(iVar1 + 0x28) + 1;
    *(int *)(iVar1 + 0x28) = iVar3;
    if (**(int **)(iVar1 + 0x14) <= iVar3) {
      *(undefined4 *)(iVar1 + 0x28) = 0;
    }
  }
  return;
}
// ==== FUN_0041bc30 @ 0041bc30
void __cdecl FUN_0041bc30(int param_1,int param_2)
{
  undefined4 uVar1;
  uVar1 = *(undefined4 *)(param_1 + param_2 * 4);
  *(undefined4 *)(param_1 + 0x28) = 0;
  *(undefined4 *)(param_1 + 0x14) = uVar1;
  return;
}
// ==== FUN_0041bc50 @ 0041bc50
void FUN_0041bc50(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = *(int *)(iVar1 + 0x2c) + 1;
  *(int *)(iVar1 + 0x2c) = iVar2;
  if (*(int *)(iVar1 + 0x30) <= iVar2) {
    iVar2 = *(int *)(iVar1 + 0x28) + 1;
    *(undefined4 *)(iVar1 + 0x2c) = 0;
    *(int *)(iVar1 + 0x28) = iVar2;
    if (**(int **)(iVar1 + 0x14) <= iVar2) {
      *(undefined4 *)(iVar1 + 0x28) = 0;
      if (*(int *)(iVar1 + 0x24) == 0) {
        *(code **)(param_1 + 8) = FUN_0041bb90;
        FUN_0041bc30(iVar1,1);
        return;
      }
      *(code **)(param_1 + 8) = FUN_0041bcc0;
      FUN_0041bc30(iVar1,0);
    }
  }
  return;
}
// ==== FUN_0041bcc0 @ 0041bcc0
void __cdecl FUN_0041bcc0(int param_1)
{
  int iVar1;
  uint uVar2;
  int iVar3;
  bool bVar4;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar3 = *(int *)(iVar1 + 0x2c) + 1;
  *(int *)(iVar1 + 0x2c) = iVar3;
  if (*(int *)(iVar1 + 0x30) <= iVar3) {
    *(undefined4 *)(iVar1 + 0x2c) = 0;
    if (*(int *)(iVar1 + 0x1c) < DAT_004437b8 / 3) {
      uVar2 = FUN_00436815();
      uVar2 = uVar2 & 0x80000003;
      bVar4 = uVar2 == 0;
      if ((int)uVar2 < 0) {
        bVar4 = (uVar2 - 1 | 0xfffffffc) == 0xffffffff;
      }
      if (bVar4) goto LAB_0041bd1d;
    }
    iVar3 = *(int *)(iVar1 + 0x1c) + -0x10;
    *(int *)(iVar1 + 0x1c) = iVar3;
    if (iVar3 < 100) {
LAB_0041bd1d:
      *(undefined4 *)(iVar1 + 0x24) = 0;
      *(code **)(param_1 + 8) = FUN_0041bc50;
      FUN_0041bc30(iVar1,2);
      return;
    }
    iVar3 = *(int *)(iVar1 + 0x28) + 1;
    *(int *)(iVar1 + 0x28) = iVar3;
    if (**(int **)(iVar1 + 0x14) <= iVar3) {
      *(undefined4 *)(iVar1 + 0x28) = 0;
    }
  }
  return;
}
// ==== FUN_0041bd50 @ 0041bd50
void FUN_0041bd50(int param_1)
{
  int iVar1;
  size_t *this;
  iVar1 = *(int *)(param_1 + 0x10);
  this = FUN_00421160(*(void **)(iVar1 + 0x14),*(int *)(iVar1 + 0x28),0);
  FUN_00421ef0(this,*(uint *)(iVar1 + 0x1c),*(int *)(iVar1 + 0x20),*this,(int)this[1] / 5,100,0);
  FUN_00421010(this);
  FUN_00421910(*(void **)(iVar1 + 0x14),*(int *)(iVar1 + 0x28),*(int *)(iVar1 + 0x1c),
               *(int *)(iVar1 + 0x20),0x100,0);
  return;
}
// ==== FUN_0041bdc0 @ 0041bdc0
undefined4 FUN_0041bdc0(int param_1,int param_2)
{
  int iVar1;
  int iVar2;
  int *piVar3;
  int *piVar4;
  CHAR aCStack_100 [256];
  iVar1 = *(int *)(*(int *)(DAT_004488bc + 4) + param_2 * 4);
  iVar2 = *(int *)(iVar1 + 0x34);
  if ((((iVar2 != -1) && (iVar2 != 1)) && (iVar2 != 2)) && (iVar2 != 5)) {
    piVar3 = _malloc(0x34);
    FUN_00436395(aCStack_100,(byte *)s_dat_MiniGame_03_hand_02d_spr_0044324c);
    piVar4 = FUN_00420e00(aCStack_100);
    *piVar3 = (int)piVar4;
    iVar1 = *(int *)(iVar1 + 0x1c);
    piVar3[2] = iVar1;
    FUN_00426ad0(iVar1);
    piVar3[3] = param_2;
    piVar3[4] = ((int)(DAT_004437b8 + (DAT_004437b8 >> 0x1f & 3U)) >> 2) * param_2 +
                ((int)(DAT_004437b8 + (DAT_004437b8 >> 0x1f & 7U)) >> 3);
    piVar3[5] = ((DAT_004437bc + -0x1e0) / 2 - *(int *)(**(int **)(*piVar3 + 0xc) + 4)) + 0x1ea;
    piVar3[6] = (DAT_004437b8 + -0x280) / 2 + 0x7f + param_2 * 0x79;
    iVar1 = DAT_004437bc;
    piVar3[9] = 1;
    piVar3[7] = (iVar1 + -0x1e0) / 2 + 0x12;
    piVar3[1] = 0;
    *(undefined1 *)(piVar3 + 0xb) = 0;
    piVar3[10] = 0;
    piVar3[0xc] = 0;
    piVar3[8] = 0;
    *(int **)(param_1 + 0x10) = piVar3;
    return 1;
  }
  return 0;
}
// ==== FUN_0041bf00 @ 0041bf00
void FUN_0041bf00(int param_1)
{
  int *piVar1;
  int iVar2;
  byte *pbVar3;
  piVar1 = *(int **)(param_1 + 0x10);
  if (*(char *)(*(int *)(*(int *)(DAT_004488bc + 4) + piVar1[3] * 4) + 0x3c) == '\0') {
    pbVar3 = (byte *)FUN_00426a80(piVar1[2]);
    if (((pbVar3 == (byte *)0x0) || (pbVar3[1] != 1)) || (1 < *pbVar3)) {
      iVar2 = piVar1[8];
      piVar1[8] = iVar2 + piVar1[9];
      if (iVar2 + piVar1[9] < -10) {
        piVar1[9] = 1;
      }
      if (2 < piVar1[8]) {
        piVar1[9] = -1;
      }
      return;
    }
  }
  _DAT_00448818 = _DAT_00448818 | (ushort)(1 << ((byte)piVar1[3] & 0x1f));
  *(code **)(param_1 + 8) = FUN_0041c090;
  *(code **)(param_1 + 0xc) = FUN_0041bfb0;
  piVar1[8] = *(int *)(**(int **)(*piVar1 + 0xc) + 4);
  FUN_004235b0(_DAT_004487fc,0x80,0x80,0,'\0');
  return;
}
// ==== FUN_0041bfb0 @ 0041bfb0
void FUN_0041bfb0(int param_1)
{
  undefined4 *puVar1;
  int iVar2;
  void *pvVar3;
  void *pvVar4;
  uint uVar5;
  undefined3 uVar6;
  byte abStack_10 [16];
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00421910((void *)*puVar1,puVar1[1],puVar1[4],puVar1[8] + puVar1[5],0x100,0);
  FUN_00421910((int *)*puVar1,*(int *)*puVar1 + -1,puVar1[6],puVar1[7],0x100,0);
  FUN_00436395(abStack_10,&DAT_004413b4);
  pvVar3 = _DAT_0044880c;
  *(undefined1 *)((int)_DAT_0044880c + 0xd) = 1;
  pvVar4 = _DAT_0044880c;
  *(undefined1 *)((int)_DAT_0044880c + 0xc) = 1;
  iVar2 = puVar1[3];
  uVar6 = (undefined3)((uint)pvVar3 >> 8);
  FUN_00424500(_DAT_0044880c,CONCAT31(uVar6,*(undefined1 *)(iVar2 * 3 + 0x443608)),
               CONCAT31((int3)((uint)pvVar4 >> 8),*(undefined1 *)(iVar2 * 3 + 0x443609)),
               CONCAT31(uVar6,*(undefined1 *)(iVar2 * 3 + 0x44360a)));
  iVar2 = puVar1[7];
  uVar5 = FUN_00424560((int)_DAT_0044880c,abStack_10);
  FUN_00424600((int)_DAT_0044880c,(puVar1[6] - (uVar5 >> 1)) + 0x1a,(byte *)(iVar2 + -0xc),-1,
               abStack_10);
  return;
}
// ==== FUN_0041c090 @ 0041c090
void FUN_0041c090(int param_1)
{
  int iVar1;
  iVar1 = *(int *)(param_1 + 0x10);
  if ((ushort)((ushort)(1 << ((byte)*(undefined4 *)(iVar1 + 0xc) & 0x1f)) & (ushort)_DAT_00448818)
      == 0) {
    *(code **)(param_1 + 8) = FUN_0041c0d0;
  }
  if (5 < *(int *)(iVar1 + 0x20)) {
    *(int *)(iVar1 + 0x20) = *(int *)(iVar1 + 0x20) + -5;
    return;
  }
  *(undefined4 *)(iVar1 + 0x20) = 0;
  return;
}
// ==== FUN_0041c0d0 @ 0041c0d0
void FUN_0041c0d0(int param_1)
{
  int iVar1;
  iVar1 = *(int *)(param_1 + 0x10);
  if ((ushort)((ushort)(1 << ((byte)*(undefined4 *)(iVar1 + 0xc) & 0x1f)) & (ushort)_DAT_00448818)
      != 0) {
    *(code **)(param_1 + 8) = FUN_0041c130;
    *(code **)(param_1 + 0xc) = FUN_0041bfb0;
    FUN_00426ad0(*(int *)(iVar1 + 8));
    *(undefined4 *)(iVar1 + 0x20) = 0;
  }
  if (5 < *(int *)(iVar1 + 0x20)) {
    *(int *)(iVar1 + 0x20) = *(int *)(iVar1 + 0x20) + -5;
    return;
  }
  *(undefined4 *)(iVar1 + 0x20) = 0;
  return;
}
// ==== FUN_0041c130 @ 0041c130
void FUN_0041c130(int param_1)
{
  undefined4 *puVar1;
  int iVar2;
  int iVar3;
  undefined4 *puVar4;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  iVar2 = *(int *)(*(int *)(DAT_004488bc + 4) + puVar1[3] * 4);
  if ((ushort)((ushort)(1 << ((byte)puVar1[3] & 0x1f)) & (ushort)_DAT_00448818) == 0) {
    *(undefined4 *)(param_1 + 8) = 0;
    return;
  }
  if ((*(char *)(puVar1 + 0xb) != '\0') &&
     (iVar3 = puVar1[1], puVar1[1] = iVar3 + 1, *(int *)*puVar1 + -1 <= iVar3 + 1)) {
    *(undefined1 *)(puVar1 + 0xb) = 0;
    puVar4 = FUN_004204a0(0,FUN_0041c210,FUN_0041c280,FUN_0041c2b0,FUN_0041c490);
    puVar1[0xc] = puVar4;
    iVar3 = puVar4[4];
    *(undefined4 *)(iVar3 + 8) = puVar1[4];
    *(undefined4 *)(iVar3 + 0xc) = puVar1[5];
    puVar1[1] = 0;
  }
  if (*(char *)(iVar2 + 0x3c) == '\0') {
    if (*(int *)(puVar1[2] + 0x1c) == 2) {
      FUN_0041c5b0();
    }
    else {
      FUN_0041c660(puVar1);
    }
  }
  else {
    FUN_0041c530(puVar1);
  }
  if ((puVar1[0xc] != 0) && (iVar2 = *(int *)(puVar1[0xc] + 0x10), *(char *)(iVar2 + 0x14) != '\0'))
  {
    if (*(char *)(iVar2 + 0x15) != '\0') {
      puVar1[10] = puVar1[10] + 1;
    }
    puVar1[0xc] = 0;
  }
  return;
}
// ==== FUN_0041c210 @ 0041c210
undefined4 FUN_0041c210(int param_1)
{
  undefined4 *puVar1;
  undefined4 *puVar2;
  puVar1 = _malloc(0x18);
  *puVar1 = _DAT_004487ec;
  puVar2 = FUN_00421160(_DAT_004487ec,0,0);
  puVar1[1] = puVar2;
  puVar1[4] = 0;
  *(undefined1 *)(puVar1 + 5) = 0;
  *(undefined1 *)((int)puVar1 + 0x15) = 0;
  *(undefined4 **)(param_1 + 0x10) = puVar1;
  FUN_00420540(_DAT_004487d8,param_1,9);
  FUN_004235b0(_DAT_00448800,0x40,0x80,0,'\0');
  return 1;
}
// ==== FUN_0041c280 @ 0041c280
void FUN_0041c280(int param_1)
{
  LPVOID pvVar1;
  pvVar1 = *(LPVOID *)(param_1 + 0x10);
  FUN_00420590(_DAT_004487d8,param_1);
  FUN_00421010(*(LPVOID *)((int)pvVar1 + 4));
  FUN_00436366(pvVar1);
  return;
}
// ==== FUN_0041c2b0 @ 0041c2b0
void FUN_0041c2b0(LPVOID param_1)
{
  int iVar1;
  uint uVar2;
  byte bVar3;
  int iVar4;
  iVar1 = *(int *)((int)param_1 + 0x10);
  if (*(char *)(iVar1 + 0x14) != '\0') {
    FUN_00420500(param_1);
    return;
  }
  uVar2 = *(int *)(iVar1 + 0xc) - 0xc;
  iVar4 = *(int *)(iVar1 + 0x10) + 1;
  *(uint *)(iVar1 + 0xc) = uVar2;
  *(int *)(iVar1 + 0x10) = iVar4;
  if (iVar4 == 0xd) {
    iVar4 = *(int *)(_DAT_00448804 + 0x10);
    uVar2 = FUN_00420fd0(*(void **)(iVar4 + 0x14),*(uint *)(iVar4 + 0x28),*(int *)(iVar4 + 0x1c),
                         *(int *)(iVar4 + 0x20),*(int *)(iVar1 + 8),uVar2);
    *(byte *)(iVar1 + 0x15) = *(byte *)(iVar1 + 0x15) | (byte)uVar2;
    uVar2 = FUN_00420fd0(*(void **)(iVar4 + 0x14),*(uint *)(iVar4 + 0x28),*(int *)(iVar4 + 0x1c),
                         *(int *)(iVar4 + 0x20),*(int *)(iVar1 + 8) + -5,*(uint *)(iVar1 + 0xc));
    *(byte *)(iVar1 + 0x15) = *(byte *)(iVar1 + 0x15) | (byte)uVar2;
    uVar2 = FUN_00420fd0(*(void **)(iVar4 + 0x14),*(uint *)(iVar4 + 0x28),*(int *)(iVar4 + 0x1c),
                         *(int *)(iVar4 + 0x20),*(int *)(iVar1 + 8) + 5,*(uint *)(iVar1 + 0xc));
    *(byte *)(iVar1 + 0x15) = *(byte *)(iVar1 + 0x15) | (byte)uVar2;
    uVar2 = FUN_00420fd0(*(void **)(iVar4 + 0x14),*(uint *)(iVar4 + 0x28),*(int *)(iVar4 + 0x1c),
                         *(int *)(iVar4 + 0x20),*(int *)(iVar1 + 8),*(int *)(iVar1 + 0xc) - 5);
    *(byte *)(iVar1 + 0x15) = *(byte *)(iVar1 + 0x15) | (byte)uVar2;
    uVar2 = FUN_00420fd0(*(void **)(iVar4 + 0x14),*(uint *)(iVar4 + 0x28),*(int *)(iVar4 + 0x1c),
                         *(int *)(iVar4 + 0x20),*(int *)(iVar1 + 8),*(int *)(iVar1 + 0xc) + 5);
    bVar3 = *(byte *)(iVar1 + 0x15) | (byte)uVar2;
    *(byte *)(iVar1 + 0x15) = bVar3;
    if (bVar3 == 0) {
      FUN_004205a0(param_1,4);
    }
    else {
      if (*(char *)(iVar4 + 0x34) == '\0') {
        *(undefined4 *)(iVar4 + 0x2c) = 0;
        FUN_004235b0(*(void **)(iVar4 + 0x18),0x80,0x80,0,'\0');
        *(undefined1 *)(iVar4 + 0x34) = 1;
      }
      FUN_0041bc30(iVar4,4);
      *(code **)(_DAT_00448804 + 8) = FUN_0041c420;
      *(undefined1 *)(iVar1 + 0x14) = 1;
    }
  }
  if (*(int *)(iVar1 + 0x10) == 0xf) {
    *(undefined1 *)(iVar1 + 0x15) = 0;
    *(undefined1 *)(iVar1 + 0x14) = 1;
  }
  return;
}
// ==== FUN_0041c420 @ 0041c420
void FUN_0041c420(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = *(int *)(iVar1 + 0x2c) + 1;
  *(int *)(iVar1 + 0x2c) = iVar2;
  if (*(int *)(iVar1 + 0x30) * 3 <= iVar2) {
    iVar2 = *(int *)(iVar1 + 0x28) + 1;
    *(undefined4 *)(iVar1 + 0x2c) = 0;
    *(int *)(iVar1 + 0x28) = iVar2;
    if (**(int **)(iVar1 + 0x14) <= iVar2) {
      *(undefined1 *)(iVar1 + 0x34) = 0;
      *(undefined4 *)(iVar1 + 0x28) = 0;
      if (*(int *)(iVar1 + 0x24) == 0) {
        *(code **)(param_1 + 8) = FUN_0041bb90;
        FUN_0041bc30(iVar1,1);
        return;
      }
      *(code **)(param_1 + 8) = FUN_0041bcc0;
      FUN_0041bc30(iVar1,0);
    }
  }
  return;
}
// ==== FUN_0041c490 @ 0041c490
void FUN_0041c490(int param_1)
{
  undefined4 *puVar1;
  int *this;
  size_t sVar2;
  size_t sVar3;
  int iVar4;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  iVar4 = 3 - ((int)(puVar1[4] + ((int)puVar1[4] >> 0x1f & 3U)) >> 2);
  if (iVar4 == 0) {
    iVar4 = 1;
  }
  this = (int *)puVar1[1];
  sVar2 = (*this * iVar4) / 3;
  sVar3 = (this[1] * iVar4) / 3;
  FUN_00421ef0(this,puVar1[2],puVar1[3] + 100,(int)sVar2 / 2,(int)sVar3 / 3,0x40,0);
  FUN_00422740((void *)*puVar1,0,puVar1[2],puVar1[3],sVar2,sVar3,0x100,0);
  return;
}
// ==== FUN_0041c530 @ 0041c530
int FUN_0041c530(int param_1)
{
  int iVar1;
  uint uVar2;
  int iVar3;
  uint uVar4;
  iVar1 = *(int *)(_DAT_00448804 + 0x10);
  uVar2 = FUN_00436815();
  iVar3 = (int)uVar2 / 6;
  if ((int)uVar2 % 6 != 0) {
    if (*(int *)(param_1 + 0x30) == 0) {
      uVar2 = *(int *)(iVar1 + 0x1c) - *(int *)(param_1 + 0x10);
      uVar4 = (int)uVar2 >> 0x1f;
      iVar3 = (uVar2 ^ uVar4) - uVar4;
      if ((iVar3 < 5) && (*(int *)(param_1 + 4) == 1)) {
        *(undefined1 *)(param_1 + 0x2c) = 1;
      }
      if ((*(char *)(param_1 + 0x2c) == '\0') && (iVar3 < 0x1e)) {
        *(undefined4 *)(param_1 + 4) = 1;
      }
    }
    iVar3 = *(int *)(param_1 + 0x10);
    if (iVar3 < *(int *)(iVar1 + 0x1c)) {
      if (*(int *)(iVar1 + 0x24) == 0) {
        *(int *)(param_1 + 0x10) = iVar3 + 6;
        return iVar3 + 6;
      }
    }
    else if (*(int *)(iVar1 + 0x24) == 1) {
      iVar3 = iVar3 + -6;
      *(int *)(param_1 + 0x10) = iVar3;
    }
  }
  return iVar3;
}
// ==== FUN_0041c5b0 @ 0041c5b0
void FUN_0041c5b0(int param_1)
{
  int iVar1;
  undefined4 uStack_4;
  iVar1 = param_1;
  if (*(int *)(param_1 + 0x30) == 0) {
    FUN_00420dc0(*(int *)(param_1 + 8),&uStack_4,&param_1);
    if ((DAT_004437bc * 2) / 3 < param_1) {
      *(undefined4 *)(iVar1 + 4) = 1;
    }
    else if ((*(int *)(iVar1 + 4) == 1) && (param_1 < DAT_004437bc / 2)) {
      *(undefined1 *)(iVar1 + 0x2c) = 1;
    }
  }
  else {
    FUN_00426ad0(*(int *)(param_1 + 8));
  }
  if ((*(char *)**(int **)(iVar1 + 8) != '\0') && (0x32 < *(int *)(iVar1 + 0x10))) {
    *(int *)(iVar1 + 0x10) = *(int *)(iVar1 + 0x10) + -6;
  }
  if ((*(char *)(**(int **)(iVar1 + 8) + 1) != '\0') &&
     (*(int *)(iVar1 + 0x10) < DAT_004437b8 + -0x32)) {
    *(int *)(iVar1 + 0x10) = *(int *)(iVar1 + 0x10) + 6;
  }
  return;
}
// ==== FUN_0041c660 @ 0041c660
void FUN_0041c660(int param_1)
{
  char *pcVar1;
  if (*(int *)(param_1 + 0x30) == 0) {
    pcVar1 = (char *)FUN_00426a80(*(int *)(param_1 + 8));
    if ((pcVar1 != (char *)0x0) && (*pcVar1 == '\0')) {
      if (pcVar1[1] == '\0') {
        *(undefined4 *)(param_1 + 4) = 1;
      }
      else {
        *(undefined1 *)(param_1 + 0x2c) = 1;
      }
    }
  }
  else {
    FUN_00426ad0(*(int *)(param_1 + 8));
  }
  if ((*(char *)(**(int **)(param_1 + 8) + 2) != '\0') && (0x32 < *(int *)(param_1 + 0x10))) {
    *(int *)(param_1 + 0x10) = *(int *)(param_1 + 0x10) + -6;
  }
  if ((*(char *)(**(int **)(param_1 + 8) + 3) != '\0') &&
     (*(int *)(param_1 + 0x10) < DAT_004437b8 + -0x32)) {
    *(int *)(param_1 + 0x10) = *(int *)(param_1 + 0x10) + 6;
  }
  return;
}
// ==== FUN_0041c6e0 @ 0041c6e0
void FUN_0041c6e0(int param_1)
{
  undefined4 *puVar1;
  int iVar2;
  int iVar3;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  iVar2 = puVar1[5];
  iVar3 = puVar1[4];
  FUN_00421910((int *)*puVar1,*(int *)*puVar1 + -1,puVar1[6],puVar1[7],0x100,0);
  FUN_00421910(_DAT_004487f8,1,iVar3,iVar2 + 0x32,0x100,0);
  FUN_00421910(_DAT_004487f8,0,iVar3,puVar1[8] + iVar2 + 0x32,0x100,0);
  return;
}
// ==== FUN_0041c750 @ 0041c750
undefined4 FUN_0041c750(int param_1)
{
  int iVar1;
  undefined4 *puVar2;
  int *piVar3;
  void *pvVar4;
  uint uVar5;
  puVar2 = _malloc(0x34);
  piVar3 = FUN_00420e00(s_dat_MiniGame_03_bg_spr_00443284);
  *puVar2 = piVar3;
  puVar2[1] = DAT_004437b8 / 2;
  puVar2[2] = DAT_004437bc / 2;
  pvVar4 = FUN_004234f0(s_dat_MiniGame_03_cat_wav_0044326c,2);
  puVar2[0xb] = pvVar4;
  puVar2[7] = DAT_004437b8 / 2;
  iVar1 = DAT_004437bc;
  *(undefined1 *)(puVar2 + 9) = 0;
  puVar2[10] = 0;
  puVar2[8] = iVar1 / 2 + 0x1e;
  uVar5 = (**(code **)(DAT_00448910 + 8))(0x9a,0xff,0x99);
  puVar2[3] = uVar5 & 0xffff;
  uVar5 = (**(code **)(DAT_00448910 + 8))(3,0xe4,0);
  puVar2[4] = uVar5 & 0xffff;
  uVar5 = (**(code **)(DAT_00448910 + 8))(1,0x5b,0);
  puVar2[5] = uVar5 & 0xffff;
  puVar2[6] = 0;
  puVar2[0xc] = 0;
  *(undefined4 **)(param_1 + 0x10) = puVar2;
  return 1;
}
// ==== FUN_0041c820 @ 0041c820
void FUN_0041c820(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00420590(_DAT_004487d8,puVar1[0xc]);
  FUN_00420500((LPVOID)puVar1[0xc]);
  FUN_00423540((LPVOID)puVar1[0xb]);
  FUN_00420f10((LPVOID)*puVar1);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_0041c860 @ 0041c860
void FUN_0041c860(int param_1)
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
  FUN_00421910((void *)*puVar3,2,puVar3[7],puVar3[8],0x100,0);
  FUN_00421910((void *)*puVar3,1,puVar3[1],puVar3[2],0x100,0);
  if (0x280 < DAT_004437b8) {
    FUN_00421910((void *)*puVar3,0,puVar3[1] + -0x280,puVar3[2],0x100,0);
    FUN_00421910((void *)*puVar3,1,puVar3[1] + -0x280,puVar3[2],0x100,0);
    FUN_00421910((void *)*puVar3,0,puVar3[1] + 0x280,puVar3[2],0x100,0);
    FUN_00421910((void *)*puVar3,1,puVar3[1] + 0x280,puVar3[2],0x100,0);
  }
  FUN_00421910((void *)*puVar3,3,puVar3[1],puVar3[2],0x100,0);
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
  uVar6 = FUN_00424560((int)_DAT_0044880c,abStack_100);
  *(undefined1 *)((int)_DAT_0044880c + 0xd) = 1;
  FUN_00424500(_DAT_0044880c,0xff,0xff,0xff);
  FUN_00424600((int)_DAT_0044880c,(puVar3[1] - (uVar6 >> 1)) + 0x112,(byte *)(iVar4 + -0xd9),0,
               abStack_100);
  return;
}
// ==== FUN_0041ca90 @ 0041ca90
void FUN_0041ca90(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  if (_DAT_00448818 == _DAT_004487f4) {
    iVar2 = FUN_0041e4c0(0);
    *(int *)(iVar1 + 0x30) = iVar2;
    FUN_00420540(_DAT_004487d8,iVar2,100);
    *(code **)(param_1 + 8) = FUN_0041cae0;
    _DAT_00448818 = 0;
  }
  return;
}
// ==== FUN_0041cae0 @ 0041cae0
void FUN_0041cae0(int param_1)
{
  int iVar1;
  char cVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  cVar2 = FUN_0041e8b0(*(undefined4 *)(iVar1 + 0x30));
  if (cVar2 != '\0') {
    FUN_00420590(_DAT_004487d8,*(int *)(iVar1 + 0x30));
    FUN_00420500(*(LPVOID *)(iVar1 + 0x30));
    *(code **)(param_1 + 8) = FUN_0041cb30;
    _DAT_00448818 = _DAT_004487f4;
  }
  return;
}
// ==== FUN_0041cb30 @ 0041cb30
int FUN_0041cb30(int param_1)
{
  int iVar1;
  int iVar2;
  uint uVar3;
  iVar1 = *(int *)(param_1 + 0x10);
  FUN_0041cc40(iVar1);
  uVar3 = *(int *)(iVar1 + 0x18) + 1;
  *(uint *)(iVar1 + 0x18) = uVar3;
  iVar2 = uVar3 * -0x33333333;
  if (uVar3 / 0x28 == 0x1e) {
    _DAT_00448818 = 0;
    iVar2 = FUN_0041e4c0(1);
    *(int *)(iVar1 + 0x30) = iVar2;
    iVar2 = FUN_00420540(_DAT_004487d8,iVar2,100);
    *(code **)(param_1 + 8) = FUN_0041cb90;
  }
  return iVar2;
}
// ==== FUN_0041cb90 @ 0041cb90
void FUN_0041cb90(int param_1)
{
  int iVar1;
  char cVar2;
  int iVar3;
  iVar1 = *(int *)(param_1 + 0x10);
  cVar2 = FUN_0041e8b0(*(undefined4 *)(iVar1 + 0x30));
  if (cVar2 != '\0') {
    FUN_00420590(_DAT_004487d8,*(int *)(iVar1 + 0x30));
    FUN_00420500(*(LPVOID *)(iVar1 + 0x30));
    iVar3 = 0;
    do {
      if (*(int *)(iVar3 + 0x4487dc) == 0) {
        *(undefined4 *)(iVar3 + 0x4431f0) = 0xffffffff;
      }
      else {
        *(int *)(iVar3 + 0x4431f0) =
             *(int *)(*(int *)(*(int *)(iVar3 + 0x4487dc) + 0x10) + 0x28) * 10;
      }
      iVar3 = iVar3 + 4;
    } while (iVar3 < 0x10);
    iVar3 = FUN_0041e8c0(0x4431f0);
    *(int *)(iVar1 + 0x30) = iVar3;
    FUN_00420540(_DAT_004487d8,iVar3,100);
    *(code **)(param_1 + 8) = FUN_0041cc20;
  }
  return;
}
// ==== FUN_0041cc20 @ 0041cc20
void FUN_0041cc20(int param_1)
{
  char cVar1;
  cVar1 = FUN_0041ee10(*(undefined4 *)(*(int *)(param_1 + 0x10) + 0x30));
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
// ==== FUN_0041cc40 @ 0041cc40
int FUN_0041cc40(int param_1)
{
  uint uVar1;
  int iVar2;
  if (*(char *)(param_1 + 0x24) == '\0') {
    uVar1 = FUN_00436815();
    iVar2 = (int)uVar1 / 100;
    if ((int)uVar1 % 100 == 0) {
      FUN_004235b0(*(void **)(param_1 + 0x2c),0x40,0x80,0,'\0');
      *(undefined1 *)(param_1 + 0x24) = 1;
      uVar1 = FUN_00436815();
      iVar2 = DAT_004437b8;
      *(undefined4 *)(param_1 + 0x28) = 0;
      *(int *)(param_1 + 0x1c) = (int)uVar1 % 400 + 0x96 + (iVar2 + -0x280) / 2;
      iVar2 = *(int *)(param_1 + 0x20) + -0x28;
      *(int *)(param_1 + 0x20) = iVar2;
    }
  }
  else {
    iVar2 = *(int *)(param_1 + 0x28) + 1;
    *(int *)(param_1 + 0x28) = iVar2;
    if (0x14 < iVar2) {
      *(undefined1 *)(param_1 + 0x24) = 0;
      iVar2 = *(int *)(param_1 + 0x20) + 0x28;
      *(int *)(param_1 + 0x20) = iVar2;
      return iVar2;
    }
  }
  return iVar2;
}
// ==== FUN_0041ccd0 @ 0041ccd0
void FUN_0041ccd0(void)
{
  _DAT_004487fc = FUN_004234f0(s_dat_MiniGame_drip_wav_00442eb0,4);
  _DAT_00448800 = FUN_004234f0(s_dat_MiniGame_03_pop_wav_004432b8,8);
  _DAT_004487f8 = FUN_00420e00(s_dat_MiniGame_pressbutton_spr_00442f20);
  _DAT_004487ec = FUN_00420e00(s_dat_MiniGame_03_stone_spr_0044329c);
  _DAT_0044880c = FUN_00424430(s_dat_MiniGame_01_number_fnt_00442fe0,0);
  return;
}
// ==== FUN_0041cd30 @ 0041cd30
void FUN_0041cd30(void)
{
  int iVar1;
  int *piVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int *piStack_4;
  piVar2 = (int *)0x4487dc;
  iVar5 = 0;
  iVar6 = 0;
  do {
    if (*piVar2 != 0) {
      iVar6 = iVar6 + 1;
    }
    piVar2 = piVar2 + 1;
  } while ((int)piVar2 < 0x4487ec);
  if (iVar6 == 4) {
    _DAT_004487f4 = 0xf;
    return;
  }
  iVar4 = 0;
  iVar3 = (int)(0x1e7 / (longlong)iVar6);
  _DAT_004487f4 = 0;
  piStack_4 = (int *)0x4487dc;
  do {
    if (*piStack_4 != 0) {
      iVar1 = *(int *)(*piStack_4 + 0x10);
      _DAT_004487f4 = _DAT_004487f4 | (ushort)(1 << ((byte)*(undefined4 *)(iVar1 + 0xc) & 0x1f));
      *(int *)(iVar1 + 0x10) = DAT_004437b8 / (iVar6 * 2) + (DAT_004437b8 / iVar6) * iVar4;
      iVar4 = iVar4 + 1;
      *(int *)(iVar1 + 0x18) = iVar3 / 2 + 0x43 + iVar5 + (DAT_004437b8 + -0x280) / 2;
      iVar5 = iVar5 + iVar3;
    }
    piStack_4 = piStack_4 + 1;
  } while ((int)piStack_4 < 0x4487ec);
  return;
}
// ==== FUN_0041ce10 @ 0041ce10
void FUN_0041ce10(void)
{
  int iVar1;
  int iVar2;
  func_0x004205c0();
  iVar1 = FUN_0040e970(_DAT_00448814,DAT_004437b8,4);
  iVar2 = FUN_0040e970(_DAT_00448810,DAT_004437bc,4);
  if ((iVar1 < 2) && (iVar2 < 2)) {
    FUN_00422da0(0,0,0);
    _DAT_00443208 = FUN_0041d040;
    _DAT_0044320c = FUN_0041d050;
    return;
  }
  _DAT_00448814 = _DAT_00448814 + iVar1;
  _DAT_00448810 = _DAT_00448810 + iVar2;
  return;
}
// ==== FUN_0041cea0 @ 0041cea0
void FUN_0041cea0(void)
{
  int iVar1;
  int *this;
  FUN_00422da0(0,0,0);
  iVar1 = (DAT_004437bc + -0x1e0) / 2;
  FUN_00422df0(0,iVar1,DAT_004437b8 + -1,iVar1 + 0x1df);
  func_0x004205f0();
  FUN_00422df0(0,0,DAT_004437b8 + -1,DAT_004437bc + -1);
  this = FUN_00423f30(DAT_00448914);
  FUN_00424270(_DAT_00448808,0,0,0x100,0);
  FUN_00423fc0(this,(DAT_004437b8 - _DAT_00448814) / 2,(DAT_004437bc - _DAT_00448810) / 2,
               _DAT_00448814,_DAT_00448810,0x100,0);
  FUN_00423eb0(this);
  return;
}
// ==== FUN_0041cf60 @ 0041cf60
void FUN_0041cf60(void)
{
  int *piVar1;
  FUN_00423eb0(_DAT_00448808);
  piVar1 = (int *)0x4487dc;
  do {
    if (*piVar1 != 0) {
      FUN_00420590(_DAT_004487d8,*piVar1);
      FUN_00420500((LPVOID)*piVar1);
    }
    piVar1 = piVar1 + 1;
  } while ((int)piVar1 < 0x4487ec);
  FUN_00420590(_DAT_004487d8,(int)_DAT_00448804);
  FUN_00420500(_DAT_00448804);
  FUN_00420590(_DAT_004487d8,(int)_DAT_004487f0);
  FUN_00420500(_DAT_004487f0);
  FUN_00420590(_DAT_004487d8,DAT_004486a0);
  func_0x00420530();
  FUN_0041d000();
  return;
}
// ==== FUN_0041d000 @ 0041d000
void FUN_0041d000(void)
{
  LPVOID pvVar1;
  int iVar2;
  int iVar3;
  FUN_004244e0(_DAT_0044880c);
  FUN_00420f10(_DAT_004487ec);
  FUN_00420f10(_DAT_004487f8);
  FUN_00423540(_DAT_00448800);
  pvVar1 = _DAT_004487fc;
  if (_DAT_004487fc != (LPVOID)0x0) {
    if (*(char *)((int)_DAT_004487fc + 0x20) != '\0') {
      FUN_00436366(*(LPVOID *)((int)_DAT_004487fc + 0x10));
    }
    iVar3 = 0;
    if (0 < *(int *)((int)pvVar1 + 0x18)) {
      iVar2 = 0;
      do {
        FUN_00429330(*(int **)(*(int *)((int)pvVar1 + 0x14) + 8 + iVar2));
        iVar3 = iVar3 + 1;
        iVar2 = iVar2 + 0x10;
      } while (iVar3 < *(int *)((int)pvVar1 + 0x18));
    }
    FUN_004231b0(DAT_00448924,(int)pvVar1);
    FUN_00436366(*(LPVOID *)((int)pvVar1 + 0x14));
    FUN_00436366(pvVar1);
  }
  return;
}
// ==== FUN_0041d040 @ 0041d040
void FUN_0041d040(void)
{
  int *piVar1;
  int iVar2;
  code *pcVar3;
  int iVar4;
  iVar4 = *(int *)(_DAT_004487d8 + 4);
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
// ==== FUN_0041d050 @ 0041d050
void FUN_0041d050(void)
{
  int iVar1;
  iVar1 = (DAT_004437bc + -0x1e0) / 2;
  FUN_00422df0(0,iVar1,DAT_004437b8 + -1,iVar1 + 0x1df);
  func_0x004205f0();
  FUN_00422df0(0,0,DAT_004437b8 + -1,DAT_004437bc + -1);
  return;
}
