// ==== FUN_00419400 @ 00419400
undefined4 FUN_00419400(int param_1)
{
  undefined4 uVar1;
  void *this;
  uint uVar2;
  uint uVar3;
  undefined4 *puVar4;
  undefined4 *puVar5;
  int iVar6;
  FUN_00420a70();
  _DAT_00448784 = 0;
  DAT_00448770 = param_1 != 0;
  _DAT_00442fc8 = 0xffffffff;
  FUN_0041a310();
  iVar6 = 6;
  do {
    uVar2 = FUN_00436815();
    uVar2 = uVar2 & 0x80000003;
    if ((int)uVar2 < 0) {
      uVar2 = (uVar2 - 1 | 0xfffffffc) + 1;
    }
    uVar3 = FUN_00436815();
    uVar3 = uVar3 & 0x80000003;
    if ((int)uVar3 < 0) {
      uVar3 = (uVar3 - 1 | 0xfffffffc) + 1;
    }
    uVar1 = *(undefined4 *)(&DAT_00448740 + uVar2 * 4);
    *(undefined4 *)(&DAT_00448740 + uVar2 * 4) = *(undefined4 *)(&DAT_00448740 + uVar3 * 4);
    iVar6 = iVar6 + -1;
    *(undefined4 *)(&DAT_00448740 + uVar3 * 4) = uVar1;
  } while (iVar6 != 0);
  _DAT_0044873c = (void *)thunk_FUN_004278d0();
  FUN_00420540(_DAT_0044873c,DAT_004486a0,0xffffffff);
  _DAT_00448760 = FUN_004204a0(0,FUN_00419eb0,FUN_00419f60,FUN_0041a160,FUN_00419f90);
  FUN_00420540(_DAT_0044873c,(int)_DAT_00448760,0);
  iVar6 = 0;
  puVar5 = (undefined4 *)0x448750;
  do {
    puVar4 = FUN_004204a0(iVar6,FUN_00419550,FUN_00419750,FUN_00419790,0x419e50);
    this = _DAT_0044873c;
    *puVar5 = puVar4;
    FUN_00420540(this,(int)puVar4,1);
    puVar5 = puVar5 + 1;
    iVar6 = iVar6 + 1;
  } while ((int)puVar5 < 0x448760);
  FUN_0041a390();
  _DAT_00448778 = FUN_00423f30(DAT_00448914);
  _DAT_00442fd8 = FUN_0041a3f0;
  _DAT_00442fdc = FUN_0041a480;
  _DAT_00448780 = 0x172;
  _DAT_0044877c = 0x116;
  return 1;
}
// ==== FUN_00419550 @ 00419550
undefined4 FUN_00419550(int param_1,int param_2)
{
  int iVar1;
  int iVar2;
  int *piVar3;
  iVar1 = *(int *)(*(int *)(DAT_004488bc + 4) + param_2 * 4);
  iVar2 = *(int *)(iVar1 + 0x34);
  if ((((iVar2 != -1) && (iVar2 != 1)) && (iVar2 != 2)) && (iVar2 != 5)) {
    piVar3 = _malloc(0x330);
    iVar2 = *(int *)(iVar1 + 0x1c);
    piVar3[1] = iVar2;
    piVar3[0xc2] = 3;
    piVar3[0xc3] = 2;
    if (*(char *)(iVar1 + 0x3c) == '\0') {
      FUN_00426ad0(iVar2);
      if (*(int *)(piVar3[1] + 0x1c) == 2) {
        FUN_00420a90();
      }
    }
    piVar3[200] = param_2;
    piVar3[0xc4] = *(int *)(param_2 * 4 + 0x442fa8) + -0x140 + DAT_004437b8 / 2;
    iVar2 = DAT_004437bc;
    iVar1 = *(int *)(param_2 * 4 + 0x442fb8);
    piVar3[0xc6] = 0;
    piVar3[199] = 1;
    piVar3[0xc5] = iVar1 + -0xf0 + iVar2 / 2;
    *piVar3 = *(int *)(&DAT_00448740 + param_2 * 4);
    piVar3[0xc9] = 0xf;
    piVar3[0xcb] = -1;
    piVar3[0xca] = -1;
    *(int **)(param_1 + 0x10) = piVar3;
    FUN_00419670(piVar3);
    return 1;
  }
  return 0;
}
// ==== FUN_00419670 @ 00419670
void __cdecl FUN_00419670(int *param_1)
{
  int iVar1;
  uint uVar2;
  uint uVar3;
  int iVar4;
  int *piVar5;
  iVar4 = 0x30;
  piVar5 = param_1 + 0x32;
  do {
    piVar5[-0x30] = *(int *)(*(int *)(*param_1 + 0xc) + (-200 - (int)param_1) + (int)piVar5);
    iVar1 = FUN_00419710(param_1[200]);
    *piVar5 = iVar1;
    iVar1 = FUN_00419710(param_1[200]);
    piVar5[0x30] = iVar1;
    piVar5[0x60] = 0;
    piVar5 = piVar5 + 1;
    iVar4 = iVar4 + -1;
  } while (iVar4 != 0);
  iVar4 = 0;
  do {
    uVar2 = FUN_00436815();
    uVar2 = uVar2 & 0x80000007;
    if ((int)uVar2 < 0) {
      uVar2 = (uVar2 - 1 | 0xfffffff8) + 1;
    }
    uVar3 = FUN_00436815();
    uVar3 = uVar3 & 0x80000001;
    if ((int)uVar3 < 0) {
      uVar3 = (uVar3 - 1 | 0xfffffffe) + 1;
    }
    iVar1 = iVar4 + uVar2;
    iVar4 = iVar4 + 8;
    param_1[iVar1 + 0x92] = uVar3 + 1;
  } while (iVar4 < 0x30);
  return;
}
// ==== FUN_00419710 @ 00419710
undefined4 __cdecl FUN_00419710(uint param_1)
{
  uint uVar1;
  uint uVar2;
  do {
    uVar1 = FUN_00436815();
    uVar1 = uVar1 & 0x80000003;
    if ((int)uVar1 < 0) {
      uVar1 = (uVar1 - 1 | 0xfffffffc) + 1;
    }
  } while (uVar1 == param_1);
  uVar2 = FUN_00436815();
  return *(undefined4 *)
          (*(int *)(*(int *)(&DAT_00448740 + uVar1 * 4) + 0xc) + ((int)uVar2 % 0x30) * 4);
}
// ==== FUN_00419750 @ 00419750
void FUN_00419750(int param_1)
{
  LPVOID pvVar1;
  pvVar1 = *(LPVOID *)(param_1 + 0x10);
  if ((*(int *)(*(int *)((int)pvVar1 + 4) + 0x1c) == 2) &&
     (*(char *)(*(int *)(*(int *)(DAT_004488bc + 4) + *(int *)((int)pvVar1 + 800) * 4) + 0x3c) ==
      '\0')) {
    FUN_00420a70();
  }
  FUN_00436366(pvVar1);
  return;
}
// ==== FUN_00419790 @ 00419790
void FUN_00419790(int param_1)
{
  int iVar1;
  byte *pbVar2;
  int iVar3;
  iVar1 = *(int *)(param_1 + 0x10);
  if (*(char *)(*(int *)(*(int *)(DAT_004488bc + 4) + *(int *)(iVar1 + 800) * 4) + 0x3c) == '\0') {
    pbVar2 = (byte *)FUN_00426a80(*(int *)(iVar1 + 4));
    if (((pbVar2 == (byte *)0x0) || (pbVar2[1] != 1)) || (1 < *pbVar2)) {
      iVar3 = *(int *)(iVar1 + 0x318) + *(int *)(iVar1 + 0x31c);
      *(int *)(iVar1 + 0x318) = iVar3;
      if (iVar3 < -10) {
        *(undefined4 *)(iVar1 + 0x31c) = 1;
      }
      if (2 < *(int *)(iVar1 + 0x318)) {
        *(undefined4 *)(iVar1 + 0x31c) = 0xffffffff;
      }
      return;
    }
  }
  _DAT_00448784 = _DAT_00448784 | (ushort)(1 << ((byte)*(undefined4 *)(iVar1 + 800) & 0x1f));
  *(code **)(param_1 + 8) = FUN_00419840;
  *(undefined4 *)(param_1 + 0xc) = 0;
  FUN_004235b0(_DAT_00448774,0x80,0x80,0,'\0');
  return;
}
// ==== FUN_00419840 @ 00419840
void FUN_00419840(int param_1)
{
  if ((ushort)((ushort)(1 << ((byte)*(undefined4 *)(*(int *)(param_1 + 0x10) + 800) & 0x1f)) &
              (ushort)_DAT_00448784) == 0) {
    *(code **)(param_1 + 8) = FUN_00419930;
    *(code **)(param_1 + 0xc) = FUN_00419870;
  }
  return;
}
// ==== FUN_00419870 @ 00419870
void FUN_00419870(int param_1)
{
  int iVar1;
  uint uVar2;
  int *piVar3;
  uint uVar4;
  iVar1 = *(int *)(param_1 + 0x10);
  uVar4 = 0;
  piVar3 = (int *)(iVar1 + 0x248);
  do {
    uVar2 = uVar4 & 0x80000007;
    if ((int)uVar2 < 0) {
      uVar2 = (uVar2 - 1 | 0xfffffff8) + 1;
    }
    FUN_00421410(*(void **)(iVar1 + 8 + (*piVar3 * 0x30 + uVar4) * 4),
                 *(int *)(iVar1 + 0x310) + uVar2 * 0x1e,
                 *(int *)(iVar1 + 0x314) + ((int)(uVar4 + ((int)uVar4 >> 0x1f & 7U)) >> 3) * 0x1e,
                 0x100,0);
    uVar4 = uVar4 + 1;
    piVar3 = piVar3 + 1;
  } while ((int)uVar4 < 0x30);
  FUN_00421410(*(void **)(*(int *)(_DAT_00448768 + 0xc) + *(int *)(iVar1 + 800) * 4),
               *(int *)(iVar1 + 0x310) + *(int *)(iVar1 + 0x308) * 0x1e,
               *(int *)(iVar1 + 0x314) + *(int *)(iVar1 + 0x30c) * 0x1e,0x100,0);
  return;
}
// ==== FUN_00419930 @ 00419930
void FUN_00419930(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(*(int *)(param_1 + 0x10) + 800);
  iVar2 = *(int *)(*(int *)(DAT_004488bc + 4) + iVar1 * 4);
  if ((ushort)((ushort)(1 << ((byte)iVar1 & 0x1f)) & (ushort)_DAT_00448784) != 0) {
    *(code **)(param_1 + 8) = FUN_00419980;
    *(code **)(param_1 + 0xc) = FUN_00419870;
    if (*(char *)(iVar2 + 0x3c) == '\0') {
      FUN_00426ad0(*(int *)(*(int *)(param_1 + 0x10) + 4));
    }
  }
  return;
}
// ==== FUN_00419980 @ 00419980
void FUN_00419980(int param_1)
{
  int iVar1;
  iVar1 = *(int *)(param_1 + 0x10);
  if ((ushort)((ushort)(1 << ((byte)*(int *)(iVar1 + 800) & 0x1f)) & (ushort)_DAT_00448784) == 0) {
    *(undefined4 *)(param_1 + 8) = 0;
    return;
  }
  if (*(char *)(*(int *)(*(int *)(DAT_004488bc + 4) + *(int *)(iVar1 + 800) * 4) + 0x3c) != '\0') {
    FUN_004199f0(iVar1);
    return;
  }
  if (*(int *)(*(int *)(iVar1 + 4) + 0x1c) == 2) {
    FUN_00419bc0();
    return;
  }
  FUN_00419d00(iVar1);
  return;
}
// ==== FUN_004199f0 @ 004199f0
int FUN_004199f0(int param_1)
{
  uint uVar1;
  int iVar2;
  int *piVar3;
  int iVar4;
  int iVar5;
  iVar5 = *(int *)(param_1 + 0x324) + -1;
  *(int *)(param_1 + 0x324) = iVar5;
  if (iVar5 < 1) {
    uVar1 = FUN_00436815();
    *(int *)(param_1 + 0x324) = (int)uVar1 % 10 + 10;
    if ((*(int *)(param_1 + 0x308) == *(int *)(param_1 + 0x328)) &&
       (*(int *)(param_1 + 0x30c) == *(int *)(param_1 + 0x32c))) {
      iVar4 = *(int *)(param_1 + 0x308) + *(int *)(param_1 + 0x30c) * 8;
      iVar2 = *(int *)(param_1 + 0x248 + iVar4 * 4) + 1;
      iVar5 = iVar2 / 3;
      iVar2 = iVar2 % 3;
      *(int *)(param_1 + 0x248 + iVar4 * 4) = iVar2;
      if (iVar2 == 0) {
        *(undefined4 *)(param_1 + 0x32c) = 0xffffffff;
        *(undefined4 *)(param_1 + 0x328) = 0xffffffff;
        return iVar5;
      }
    }
    else {
      if (*(int *)(param_1 + 0x32c) == -1) {
        iVar5 = 5;
        do {
          uVar1 = FUN_00436815();
          iVar4 = 8;
          piVar3 = (int *)(((int)uVar1 % 6) * 0x20 + 0x248 + param_1);
          do {
            if (*piVar3 != 0) {
              *(int *)(param_1 + 0x32c) = (int)uVar1 % 6;
              iVar5 = 0;
            }
            piVar3 = piVar3 + 1;
            iVar4 = iVar4 + -1;
          } while (iVar4 != 0);
          iVar5 = iVar5 + -1;
        } while (0 < iVar5);
      }
      if ((*(int *)(param_1 + 0x328) == -1) && (*(int *)(param_1 + 0x32c) != -1)) {
        iVar5 = 5;
        do {
          uVar1 = FUN_00436815();
          uVar1 = uVar1 & 0x80000007;
          if ((int)uVar1 < 0) {
            uVar1 = (uVar1 - 1 | 0xfffffff8) + 1;
          }
          if (*(int *)(param_1 + 0x248 + (uVar1 + *(int *)(param_1 + 0x32c) * 8) * 4) != 0) {
            *(uint *)(param_1 + 0x328) = uVar1;
            iVar5 = 0;
          }
          iVar5 = iVar5 + -1;
        } while (0 < iVar5);
      }
      iVar5 = FUN_00419b20(param_1);
    }
  }
  return iVar5;
}
// ==== FUN_00419b20 @ 00419b20
void FUN_00419b20(int param_1)
{
  int iVar1;
  if ((*(int *)(param_1 + 0x308) != *(int *)(param_1 + 0x328)) && (*(int *)(param_1 + 0x328) != -1))
  {
    FUN_004235b0(_DAT_00448774,0x40,0x80,0,'\0');
    iVar1 = *(int *)(param_1 + 0x308);
    if (*(int *)(param_1 + 0x328) < iVar1) {
      *(int *)(param_1 + 0x308) = iVar1 + -1;
      return;
    }
    *(int *)(param_1 + 0x308) = iVar1 + 1;
    return;
  }
  if ((*(int *)(param_1 + 0x30c) != *(int *)(param_1 + 0x32c)) && (*(int *)(param_1 + 0x32c) != -1))
  {
    FUN_004235b0(_DAT_00448774,0x40,0x80,0,'\0');
    iVar1 = *(int *)(param_1 + 0x30c);
    if (*(int *)(param_1 + 0x32c) < iVar1) {
      *(int *)(param_1 + 0x30c) = iVar1 + -1;
      return;
    }
    *(int *)(param_1 + 0x30c) = iVar1 + 1;
  }
  return;
}
// ==== FUN_00419bc0 @ 00419bc0
int FUN_00419bc0(int param_1)
{
  byte *pbVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iStack_4;
  iVar3 = param_1;
  pbVar1 = (byte *)FUN_00426a80(*(int *)(param_1 + 4));
  if ((((*(int *)(iVar3 + 0x308) == *(int *)(iVar3 + 0x328)) &&
       (*(int *)(iVar3 + 0x30c) == *(int *)(iVar3 + 0x32c))) && (pbVar1 != (byte *)0x0)) &&
     ((pbVar1[1] == 1 && (*pbVar1 < 2)))) {
    iVar4 = *(int *)(iVar3 + 0x308) + *(int *)(iVar3 + 0x30c) * 8;
    FUN_004235b0(_DAT_00448774,0x80,0x80,0,'\0');
    iVar2 = *(int *)(iVar3 + 0x248 + iVar4 * 4) + 1;
    *(int *)(iVar3 + 0x248 + iVar4 * 4) = iVar2 % 3;
    return iVar2 / 3;
  }
  iVar4 = *(int *)(iVar3 + 0x324) + -1;
  *(int *)(iVar3 + 0x324) = iVar4;
  if (iVar4 < 1) {
    *(undefined4 *)(iVar3 + 0x324) = 0xf;
    FUN_00420dc0(*(int *)(iVar3 + 4),&param_1,&iStack_4);
    iVar4 = *(int *)(iVar3 + 0x310);
    if ((iVar4 <= param_1) && (param_1 <= iVar4 + 0xf0)) {
      iVar2 = *(int *)(iVar3 + 0x314);
      if ((iVar2 <= iStack_4) && (iStack_4 <= iVar2 + 0xb4)) {
        *(int *)(iVar3 + 0x328) = (param_1 - iVar4) / 0x1e;
        *(int *)(iVar3 + 0x32c) = (iStack_4 - iVar2) / 0x1e;
        iVar3 = FUN_00419b20(iVar3);
        return iVar3;
      }
    }
    iVar4 = -1;
    *(undefined4 *)(iVar3 + 0x32c) = 0xffffffff;
    *(undefined4 *)(iVar3 + 0x328) = 0xffffffff;
  }
  return iVar4;
}
// ==== FUN_00419d00 @ 00419d00
byte * FUN_00419d00(int param_1)
{
  byte *pbVar1;
  int iVar2;
  int iVar3;
  uint uVar4;
  pbVar1 = (byte *)FUN_00426a80(*(int *)(param_1 + 4));
  if ((pbVar1 != (byte *)0x0) && (pbVar1[1] == 1)) {
    pbVar1 = (byte *)(uint)*pbVar1;
    switch(pbVar1) {
    case (byte *)0x0:
    case (byte *)0x1:
      FUN_004235b0(_DAT_00448774,0x40,0x80,0,'\0');
      iVar3 = *(int *)(param_1 + 0x308) + *(int *)(param_1 + 0x30c) * 8;
      iVar2 = *(int *)(param_1 + 0x248 + iVar3 * 4) + 1;
      *(int *)(param_1 + 0x248 + iVar3 * 4) = iVar2 % 3;
      return (byte *)(iVar2 / 3);
    case (byte *)0x2:
      pbVar1 = (byte *)FUN_004235b0(_DAT_00448774,0x40,0x80,0,'\0');
      uVar4 = *(int *)(param_1 + 0x308) + 7U & 0x80000007;
      if ((int)uVar4 < 0) {
        uVar4 = (uVar4 - 1 | 0xfffffff8) + 1;
      }
      *(uint *)(param_1 + 0x308) = uVar4;
      return pbVar1;
    case (byte *)0x3:
      pbVar1 = (byte *)FUN_004235b0(_DAT_00448774,0x40,0x80,0,'\0');
      uVar4 = *(int *)(param_1 + 0x308) + 1U & 0x80000007;
      if ((int)uVar4 < 0) {
        uVar4 = (uVar4 - 1 | 0xfffffff8) + 1;
      }
      *(uint *)(param_1 + 0x308) = uVar4;
      return pbVar1;
    case (byte *)0x4:
      FUN_004235b0(_DAT_00448774,0x40,0x80,0,'\0');
      iVar3 = *(int *)(param_1 + 0x30c) + 5;
      *(int *)(param_1 + 0x30c) = iVar3 % 6;
      return (byte *)(iVar3 / 6);
    case (byte *)0x5:
      FUN_004235b0(_DAT_00448774,0x40,0x80,0,'\0');
      iVar3 = *(int *)(param_1 + 0x30c) + 1;
      pbVar1 = (byte *)(iVar3 / 6);
      *(int *)(param_1 + 0x30c) = iVar3 % 6;
    }
  }
  return pbVar1;
}
// ==== FUN_00419eb0 @ 00419eb0
undefined4 FUN_00419eb0(int param_1)
{
  undefined4 *puVar1;
  int *piVar2;
  undefined4 uVar3;
  uint uVar4;
  puVar1 = _malloc(0x24);
  piVar2 = FUN_00420e00(s_dat_MiniGame_01_bg_spr_00442ffc);
  *puVar1 = piVar2;
  uVar3 = FUN_00424430(s_dat_MiniGame_01_number_fnt_00442fe0,0);
  puVar1[1] = uVar3;
  puVar1[5] = DAT_004437b8 / 2;
  puVar1[6] = DAT_004437bc / 2;
  uVar4 = (**(code **)(DAT_00448910 + 8))(0x9a,0xff,0x99);
  puVar1[2] = uVar4 & 0xffff;
  uVar4 = (**(code **)(DAT_00448910 + 8))(3,0xe4,0);
  puVar1[3] = uVar4 & 0xffff;
  uVar4 = (**(code **)(DAT_00448910 + 8))(1,0x5b,0);
  puVar1[4] = uVar4 & 0xffff;
  puVar1[7] = 0;
  *(undefined4 **)(param_1 + 0x10) = puVar1;
  return 1;
}
// ==== FUN_00419f60 @ 00419f60
void FUN_00419f60(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_004244e0((LPVOID)puVar1[1]);
  FUN_00420f10((LPVOID)*puVar1);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_00419f90 @ 00419f90
void FUN_00419f90(int param_1)
{
  int iVar1;
  int iVar2;
  int *piVar3;
  int iVar4;
  undefined4 uVar5;
  uint uVar6;
  undefined2 extraout_var;
  int iVar7;
  byte abStack_100 [256];
  piVar3 = *(int **)(param_1 + 0x10);
  FUN_0041a0e0(*(undefined4 *)(*(int *)(*piVar3 + 0xc) + 4));
  FUN_00421910((void *)*piVar3,0,piVar3[5],piVar3[6],0x100,0);
  iVar4 = piVar3[6];
  iVar1 = piVar3[5] + -0xfd;
  iVar2 = ((uint)(piVar3[7] * 0x1e7) / 0x4b0 - 0xfd) + piVar3[5];
  uVar5 = FUN_00422e70(iVar1,iVar2,iVar4 + -0xc3,
                       CONCAT22((short)((uint)(piVar3[7] * 0x1e7) / 0x4b00000),(short)piVar3[2]),
                       0x100);
  iVar7 = 0x2e;
  do {
    uVar5 = FUN_00422e70(iVar1,iVar2,iVar4 + -0xf0 + iVar7,
                         CONCAT22((short)((uint)uVar5 >> 0x10),(short)piVar3[3]),0x100);
    iVar7 = iVar7 + 1;
  } while (iVar7 < 0x42);
  FUN_00422e70(iVar1,iVar2,iVar4 + -0xae,CONCAT22((short)((uint)uVar5 >> 0x10),(short)piVar3[4]),
               0x100);
  FUN_00422ef0(iVar2,iVar4 + -0xc3,iVar4 + -0xae,CONCAT22(extraout_var,(short)piVar3[4]),0x100);
  FUN_00436395(abStack_100,&DAT_00442574);
  uVar6 = FUN_00424560(piVar3[1],abStack_100);
  *(undefined1 *)(piVar3[1] + 0xd) = 1;
  FUN_00424600(piVar3[1],(piVar3[5] - (uVar6 >> 1)) + 0x112,(byte *)(iVar4 + -0xd9),0,abStack_100);
  return;
}
// ==== FUN_0041a0e0 @ 0041a0e0
void FUN_0041a0e0(int *param_1)
{
  int iVar1;
  int iVar2;
  int iVar3;
  int iStack_4;
  iVar2 = 0;
  iStack_4 = 0;
  if (DAT_004437bc / param_1[1] != -2 && -1 < DAT_004437bc / param_1[1] + 2) {
    do {
      iVar3 = 0;
      iVar1 = 0;
      if (DAT_004437b8 / *param_1 != -2 && -1 < DAT_004437b8 / *param_1 + 2) {
        do {
          FUN_00421410(param_1,iVar3,iVar2,0x100,0);
          iVar3 = iVar3 + *param_1;
          iVar1 = iVar1 + 1;
        } while (iVar1 < DAT_004437b8 / *param_1 + 2);
      }
      iVar2 = iVar2 + param_1[1];
      iStack_4 = iStack_4 + 1;
    } while (iStack_4 < DAT_004437bc / param_1[1] + 2);
  }
  return;
}
// ==== FUN_0041a160 @ 0041a160
void FUN_0041a160(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  if (_DAT_00448784 == _DAT_00448764) {
    iVar2 = FUN_0041e4c0(0);
    *(int *)(iVar1 + 0x20) = iVar2;
    FUN_00420540(_DAT_0044873c,iVar2,100);
    *(code **)(param_1 + 8) = FUN_0041a1b0;
    _DAT_00448784 = 0;
  }
  return;
}
// ==== FUN_0041a1b0 @ 0041a1b0
void FUN_0041a1b0(int param_1)
{
  int iVar1;
  char cVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  cVar2 = FUN_0041e8b0(*(undefined4 *)(iVar1 + 0x20));
  if (cVar2 != '\0') {
    FUN_00420590(_DAT_0044873c,*(int *)(iVar1 + 0x20));
    FUN_00420500(*(LPVOID *)(iVar1 + 0x20));
    *(code **)(param_1 + 8) = FUN_0041a200;
    _DAT_00448784 = _DAT_00448764;
  }
  return;
}
// ==== FUN_0041a200 @ 0041a200
void FUN_0041a200(int param_1)
{
  int iVar1;
  int iVar2;
  int iVar3;
  int *piVar4;
  uint uVar5;
  int iVar6;
  int *piVar7;
  undefined4 uVar8;
  iVar1 = *(int *)(param_1 + 0x10);
  uVar5 = *(int *)(iVar1 + 0x1c) + 1;
  *(uint *)(iVar1 + 0x1c) = uVar5;
  if (uVar5 / 0x28 == 0x1e) {
    uVar8 = 1;
LAB_0041a27b:
    _DAT_00448784 = 0;
    iVar3 = FUN_0041e4c0(uVar8);
    *(int *)(iVar1 + 0x20) = iVar3;
    FUN_00420540(_DAT_0044873c,iVar3,100);
    *(code **)(param_1 + 8) = FUN_0041a2a0;
    return;
  }
  iVar3 = 0;
  piVar7 = (int *)0x448750;
  do {
    if (*piVar7 != 0) {
      iVar2 = 0;
      piVar4 = (int *)(*(int *)(*piVar7 + 0x10) + 0x248);
      iVar6 = 0x30;
      do {
        iVar2 = iVar2 + *piVar4;
        piVar4 = piVar4 + 1;
        iVar6 = iVar6 + -1;
      } while (iVar6 != 0);
      if (iVar2 == 0) {
        uVar8 = 2;
        _DAT_00442fc8 = iVar3;
        goto LAB_0041a27b;
      }
    }
    piVar7 = piVar7 + 1;
    iVar3 = iVar3 + 1;
    if (0x44875f < (int)piVar7) {
      return;
    }
  } while( true );
}
// ==== FUN_0041a2a0 @ 0041a2a0
void FUN_0041a2a0(int param_1)
{
  int iVar1;
  char cVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  cVar2 = FUN_0041e8b0(*(undefined4 *)(iVar1 + 0x20));
  if (cVar2 != '\0') {
    FUN_00420590(_DAT_0044873c,*(int *)(iVar1 + 0x20));
    FUN_00420500(*(LPVOID *)(iVar1 + 0x20));
    *(undefined4 *)(param_1 + 8) = 0;
    if ((_DAT_00442fc8 != -1) && (DAT_00448770 == '\0')) {
      FUN_00423890(0x442ea0,_DAT_00442fc8);
      return;
    }
    func_0x00423920();
  }
  return;
}
// ==== FUN_0041a310 @ 0041a310
void FUN_0041a310(void)
{
  int *piVar1;
  int iVar2;
  CHAR aCStack_100 [256];
  iVar2 = 0;
  do {
    FUN_00436395(aCStack_100,(byte *)s_dat_MiniGame_01__s_spr_00443030);
    piVar1 = FUN_00420e00(aCStack_100);
    *(int **)(&DAT_00448740 + iVar2) = piVar1;
    iVar2 = iVar2 + 4;
  } while (iVar2 < 0x10);
  _DAT_00448768 = FUN_00420e00(s_dat_MiniGame_01_cursor_spr_00443014);
  _DAT_0044876c = FUN_00420e00(s_dat_MiniGame_pressbutton_spr_00442f20);
  _DAT_00448774 = FUN_004234f0(s_dat_MiniGame_drip_wav_00442eb0,4);
  return;
}
// ==== FUN_0041a390 @ 0041a390
void FUN_0041a390(void)
{
  int *piVar1;
  int iVar2;
  iVar2 = 0;
  piVar1 = (int *)0x448750;
  do {
    if (*piVar1 != 0) {
      iVar2 = iVar2 + 1;
    }
    piVar1 = piVar1 + 1;
  } while ((int)piVar1 < 0x448760);
  if (iVar2 == 4) {
    _DAT_00448764 = 0xf;
    return;
  }
  _DAT_00448764 = 0;
  piVar1 = (int *)0x448750;
  do {
    if (*piVar1 != 0) {
      _DAT_00448764 =
           _DAT_00448764 |
           (ushort)(1 << ((byte)*(undefined4 *)(*(int *)(*piVar1 + 0x10) + 800) & 0x1f));
    }
    piVar1 = piVar1 + 1;
  } while ((int)piVar1 < 0x448760);
  return;
}
// ==== FUN_0041a3f0 @ 0041a3f0
void FUN_0041a3f0(void)
{
  int iVar1;
  int iVar2;
  func_0x004205c0();
  iVar1 = FUN_0040e970(_DAT_00448780,DAT_004437b8,4);
  iVar2 = FUN_0040e970(_DAT_0044877c,DAT_004437bc,4);
  if ((iVar1 < 2) && (iVar2 < 2)) {
    FUN_00422da0(0,0,0);
    _DAT_00442fd8 = FUN_0041a600;
    _DAT_00442fdc = FUN_0041a610;
    return;
  }
  _DAT_00448780 = _DAT_00448780 + iVar1;
  _DAT_0044877c = _DAT_0044877c + iVar2;
  return;
}
// ==== FUN_0041a480 @ 0041a480
void FUN_0041a480(void)
{
  int iVar1;
  int *this;
  FUN_00422da0(0,0,0);
  iVar1 = (DAT_004437bc + -0x1e0) / 2;
  FUN_00422df0(0,iVar1,DAT_004437b8 + -1,iVar1 + 0x1df);
  func_0x004205f0();
  FUN_00422df0(0,0,DAT_004437b8 + -1,DAT_004437bc + -1);
  this = FUN_00423f30(DAT_00448914);
  FUN_00424270(_DAT_00448778,0,0,0x100,0);
  FUN_00423fc0(this,(DAT_004437b8 - _DAT_00448780) / 2,(DAT_004437bc - _DAT_0044877c) / 2,
               _DAT_00448780,_DAT_0044877c,0x100,0);
  FUN_00423eb0(this);
  return;
}
// ==== FUN_0041a540 @ 0041a540
void FUN_0041a540(void)
{
  int *piVar1;
  FUN_00423eb0(_DAT_00448778);
  FUN_00420590(_DAT_0044873c,DAT_004486a0);
  piVar1 = (int *)0x448750;
  do {
    if (*piVar1 != 0) {
      FUN_00420590(_DAT_0044873c,*piVar1);
      FUN_00420500((LPVOID)*piVar1);
    }
    piVar1 = piVar1 + 1;
  } while ((int)piVar1 < 0x448760);
  FUN_00420590(_DAT_0044873c,(int)_DAT_00448760);
  FUN_00420500(_DAT_00448760);
  func_0x00420530();
  FUN_0041a5c0();
  return;
}
// ==== FUN_0041a5c0 @ 0041a5c0
void FUN_0041a5c0(void)
{
  undefined4 *puVar1;
  FUN_00423540(_DAT_00448774);
  FUN_00420f10(_DAT_0044876c);
  FUN_00420f10(_DAT_00448768);
  puVar1 = (undefined4 *)&DAT_00448740;
  do {
    FUN_00420f10((LPVOID)*puVar1);
    puVar1 = puVar1 + 1;
  } while ((int)puVar1 < 0x448750);
  return;
}
// ==== FUN_0041a600 @ 0041a600
void FUN_0041a600(void)
{
  int *piVar1;
  int iVar2;
  code *pcVar3;
  int iVar4;
  iVar4 = *(int *)(_DAT_0044873c + 4);
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
// ==== FUN_0041a610 @ 0041a610
void FUN_0041a610(void)
{
  int iVar1;
  iVar1 = (DAT_004437bc + -0x1e0) / 2;
  FUN_00422df0(0,iVar1,DAT_004437b8 + -1,iVar1 + 0x1df);
  func_0x004205f0();
  FUN_00422df0(0,0,DAT_004437b8 + -1,DAT_004437bc + -1);
  return;
}
