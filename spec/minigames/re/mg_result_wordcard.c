// ==== FUN_00418b80 @ 00418b80
undefined4 FUN_00418b80(undefined4 param_1)
{
  _DAT_00448734 = (void *)thunk_FUN_004278d0();
  _DAT_00448730 = FUN_004204a0(param_1,FUN_004191a0,FUN_00419250,0,FUN_00419280);
  FUN_00420540(_DAT_00448734,(int)_DAT_00448730,0);
  _DAT_00448738 = FUN_004204a0(param_1,FUN_00418bf0,FUN_00418de0,FUN_00418e70,FUN_00419070);
  FUN_00420540(_DAT_00448734,(int)_DAT_00448738,100);
  return 1;
}
// ==== FUN_00418bf0 @ 00418bf0
undefined4 FUN_00418bf0(int param_1,int param_2)
{
  int iVar1;
  int iVar2;
  undefined4 *puVar3;
  int *piVar4;
  undefined4 *puVar5;
  uint *puVar6;
  uint uVar7;
  void *pvVar8;
  int iVar9;
  int iVar10;
  byte abStack_100 [256];
  puVar3 = _malloc(0x5c);
  iVar10 = 0;
  puVar3[5] = 0;
  piVar4 = FUN_00420e00(s_dat_MiniGame_pressbutton_spr_00442f20);
  *puVar3 = piVar4;
  puVar5 = FUN_004230f0();
  puVar3[1] = puVar5;
  iVar9 = 0;
  if (0 < DAT_00448724) {
    do {
      piVar4 = _malloc(0x10);
      FUN_004184c0(iVar10);
      FUN_00436395(abStack_100,(byte *)s_dat_WordCard__s_00442f10);
      puVar6 = FUN_00423970(abStack_100);
      *piVar4 = (int)puVar6;
      piVar4[1] = iVar10;
      puVar3[0x10] = *puVar6;
      puVar3[0x11] = *(undefined4 *)(*piVar4 + 4);
      iVar2 = DAT_004437b8;
      iVar1 = *(int *)*piVar4;
      piVar4[3] = iVar9;
      piVar4[2] = iVar2 / 2 - iVar1 / 2;
      iVar9 = iVar9 + *(int *)(*piVar4 + 4);
      FUN_00423140((void *)puVar3[1],piVar4);
      iVar10 = iVar10 + 1;
    } while (iVar10 < DAT_00448724);
  }
  puVar3[8] = iVar9;
  puVar3[3] = param_2;
  puVar3[6] = 0x28;
  puVar3[4] = 0xffffffff;
  *(undefined1 *)(puVar3 + 9) = 0;
  puVar3[7] = 0x78;
  puVar3[10] = (DAT_004437b8 * 5) / 6;
  iVar9 = DAT_004437bc;
  puVar3[0xc] = 0;
  puVar3[0xd] = 1;
  puVar3[0xb] = iVar9 / 2 + 200;
  puVar3[0xe] = (DAT_004437b8 + -0x280) / 2 + 0xc3;
  iVar9 = (DAT_004437bc + -0x1e0) / 2;
  puVar3[0xf] = iVar9 + 0xb7;
  puVar3[0x10] = puVar3[0x10] + puVar3[0xe] + -1;
  puVar3[0x11] = puVar3[0x11] + iVar9 + 0xb6;
  iVar9 = *(int *)(*(int *)(DAT_004488bc + 4) + param_2 * 4);
  uVar7 = FUN_00436815();
  puVar3[0x12] = (int)uVar7 % 0x50 + 0x28;
  if (*(char *)(iVar9 + 0x3c) == '\0') {
    iVar9 = *(int *)(iVar9 + 0x1c);
    puVar3[2] = iVar9;
    FUN_00426ad0(iVar9);
  }
  else {
    puVar3[2] = 0;
  }
  pvVar8 = FUN_004234f0(s_dat_MiniGame_result_drum_long_wa_00442eec,2);
  puVar3[0x13] = pvVar8;
  pvVar8 = FUN_004234f0(s_dat_MiniGame_result_drum_short_w_00442ec8,2);
  puVar3[0x14] = pvVar8;
  pvVar8 = FUN_004234f0(s_dat_MiniGame_drip_wav_00442eb0,2);
  puVar3[0x15] = pvVar8;
  iVar9 = FUN_004235b0((void *)puVar3[0x13],0xff,0x80,1,'\x01');
  puVar3[0x16] = iVar9;
  *(undefined4 **)(param_1 + 0x10) = puVar3;
  return 1;
}
// ==== FUN_00418de0 @ 00418de0
void FUN_00418de0(int param_1)
{
  undefined4 *puVar1;
  undefined4 *puVar2;
  int *piVar3;
  int iVar4;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00423540((LPVOID)puVar1[0x15]);
  FUN_00423540((LPVOID)puVar1[0x13]);
  FUN_00423540((LPVOID)puVar1[0x14]);
  piVar3 = (int *)puVar1[1];
  iVar4 = 0;
  if (0 < *piVar3) {
    do {
      puVar2 = *(undefined4 **)(piVar3[1] + iVar4 * 4);
      FUN_00423eb0((LPVOID)*puVar2);
      FUN_00436366(puVar2);
      piVar3 = (int *)puVar1[1];
      iVar4 = iVar4 + 1;
    } while (iVar4 < *piVar3);
  }
  FUN_00423120((LPVOID)puVar1[1]);
  if (puVar1[2] != 0) {
    FUN_00426ad0(puVar1[2]);
  }
  FUN_00420f10((LPVOID)*puVar1);
  if ((LPVOID)puVar1[5] != (LPVOID)0x0) {
    FUN_00436366((LPVOID)puVar1[5]);
  }
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_00418e70 @ 00418e70
void FUN_00418e70(int param_1)
{
  int iVar1;
  byte *pbVar2;
  int *piVar3;
  uint *puVar4;
  int iVar5;
  int iVar6;
  uint auStack_40 [16];
  iVar1 = *(int *)(param_1 + 0x10);
  if (*(char *)(iVar1 + 0x24) == '\0') {
    iVar5 = *(int *)(iVar1 + 0x30) + *(int *)(iVar1 + 0x34);
    *(int *)(iVar1 + 0x30) = iVar5;
    if (iVar5 < -10) {
      *(undefined4 *)(iVar1 + 0x34) = 1;
    }
    if (2 < *(int *)(iVar1 + 0x30)) {
      *(undefined4 *)(iVar1 + 0x34) = 0xffffffff;
    }
    if (*(char *)(*(int *)(*(int *)(DAT_004488bc + 4) + *(int *)(iVar1 + 0xc) * 4) + 0x3c) == '\0')
    {
      pbVar2 = (byte *)FUN_00426a80(*(int *)(iVar1 + 8));
      if (((pbVar2 != (byte *)0x0) && (pbVar2[1] == 0)) && (*pbVar2 < 2)) {
        FUN_004235b0(*(void **)(iVar1 + 0x54),0xff,0x80,0,'\0');
        *(undefined1 *)(iVar1 + 0x24) = 1;
        FUN_004236a0(*(int *)(iVar1 + 0x58));
        FUN_004235b0(*(void **)(iVar1 + 0x50),0xff,0x80,0,'\0');
      }
    }
    else {
      iVar5 = *(int *)(iVar1 + 0x48) + -1;
      *(int *)(iVar1 + 0x48) = iVar5;
      if (iVar5 == 0) {
        *(undefined1 *)(iVar1 + 0x24) = 1;
      }
    }
  }
  else {
    if (0 < *(int *)(iVar1 + 0x18)) {
      *(int *)(iVar1 + 0x18) = *(int *)(iVar1 + 0x18) + -1;
    }
    if ((*(int *)(iVar1 + 0x18) == 0) && (*(int *)(iVar1 + 0x10) == -1)) {
      iVar6 = 0;
      iVar5 = **(int **)(iVar1 + 4);
      if (0 < iVar5) {
        piVar3 = (int *)(*(int **)(iVar1 + 4))[1];
        do {
          if (*(int *)(*piVar3 + 0xc) == (DAT_004437bc + -0x1e0) / 2 + 0xb7) {
            *(code **)(param_1 + 8) = FUN_00419040;
            *(int *)(iVar1 + 0x10) = iVar6;
            FUN_00425790(DAT_00448888,&DAT_00441510);
            FUN_00418460(*(int *)(iVar1 + 0x10));
            pbVar2 = (byte *)FUN_00425860(DAT_00448888,s_winnerMsg_00442f40,0);
            FUN_00436395((undefined1 *)auStack_40,pbVar2);
            puVar4 = FUN_0043e8ea(auStack_40);
            *(uint **)(iVar1 + 0x14) = puVar4;
            return;
          }
          iVar6 = iVar6 + 1;
          piVar3 = piVar3 + 1;
        } while (iVar6 < iVar5);
      }
      *(undefined4 *)(iVar1 + 0x18) = 1;
    }
  }
  piVar3 = *(int **)(iVar1 + 4);
  iVar5 = 0;
  if (0 < *piVar3) {
    do {
      piVar3 = *(int **)(piVar3[1] + iVar5 * 4);
      iVar6 = piVar3[3] + *(int *)(iVar1 + 0x18);
      piVar3[3] = iVar6;
      if (*(int *)(iVar1 + 0x20) - *(int *)(*piVar3 + 4) <= iVar6) {
        piVar3[3] = iVar6 - *(int *)(iVar1 + 0x20);
      }
      piVar3 = *(int **)(iVar1 + 4);
      iVar5 = iVar5 + 1;
    } while (iVar5 < *piVar3);
  }
  return;
}
// ==== FUN_00419040 @ 00419040
void FUN_00419040(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = *(int *)(iVar1 + 0x1c) + -1;
  *(int *)(iVar1 + 0x1c) = iVar2;
  if (iVar2 != 0) {
    return;
  }
  FUN_00423140(*(void **)(*(int *)(*(int *)(DAT_004488bc + 4) + *(int *)(iVar1 + 0xc) * 4) + 0x20),
               *(undefined4 *)(iVar1 + 0x10));
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
// ==== FUN_00419070 @ 00419070
void FUN_00419070(int param_1)
{
  undefined4 *puVar1;
  undefined4 *puVar2;
  int *piVar3;
  uint uVar4;
  int iVar5;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00422df0(puVar1[0xe],puVar1[0xf],puVar1[0x10],puVar1[0x11]);
  piVar3 = (int *)puVar1[1];
  iVar5 = 0;
  if (0 < *piVar3) {
    do {
      puVar2 = *(undefined4 **)(piVar3[1] + iVar5 * 4);
      FUN_00424270((void *)*puVar2,puVar2[2],puVar2[3],0x100,0);
      piVar3 = (int *)puVar1[1];
      iVar5 = iVar5 + 1;
    } while (iVar5 < *piVar3);
  }
  FUN_00422df0(0,0,DAT_004437b8 + -1,DAT_004437bc + -1);
  if (*(char *)(puVar1 + 9) == '\0') {
    FUN_00421910((void *)*puVar1,1,puVar1[10],puVar1[0xb],0x100,0);
    FUN_00421910((void *)*puVar1,0,puVar1[10],puVar1[0xc] + puVar1[0xb],0x100,0);
  }
  if (puVar1[5] != 0) {
    FUN_00424500(DAT_004488d8,0xff,0xff,0xff);
    FUN_00424530(DAT_004488d8,0,0,0);
    *(undefined1 *)((int)DAT_004488d8 + 0xd) = 1;
    uVar4 = FUN_00424560((int)DAT_004488d8,(byte *)puVar1[5]);
    FUN_00424600((int)DAT_004488d8,DAT_004437b8 - uVar4 >> 1,(byte *)(DAT_004437bc / 2 + 0xdc),-1,
                 (byte *)puVar1[5]);
  }
  return;
}
// ==== FUN_004191a0 @ 004191a0
undefined4 FUN_004191a0(int param_1)
{
  undefined4 *puVar1;
  int *piVar2;
  CHAR aCStack_100 [256];
  puVar1 = _malloc(0x14);
  puVar1[3] = DAT_004437b8 / 2;
  puVar1[4] = DAT_004437bc / 2;
  piVar2 = FUN_00420e00(s_dat_MiniGame_result_bg_spr_00442f8c);
  *puVar1 = piVar2;
  FUN_00436395(aCStack_100,(byte *)s_dat_MiniGame_result_player_02d_s_00442f68);
  piVar2 = FUN_00420e00(aCStack_100);
  puVar1[1] = piVar2;
  FUN_00436395(aCStack_100,(byte *)s_dat_MiniGame_result__s_spr_00442f4c);
  piVar2 = FUN_00420e00(aCStack_100);
  puVar1[2] = piVar2;
  *(undefined4 **)(param_1 + 0x10) = puVar1;
  return 1;
}
// ==== FUN_00419250 @ 00419250
void FUN_00419250(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00420f10((LPVOID)*puVar1);
  FUN_00420f10((LPVOID)puVar1[1]);
  FUN_00420f10((LPVOID)puVar1[2]);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_00419280 @ 00419280
void FUN_00419280(int param_1)
{
  undefined4 *puVar1;
  int *piVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  int iStack_8;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  piVar2 = *(int **)(*(int *)(puVar1[1] + 0xc) + 4);
  iVar3 = *piVar2;
  iVar4 = piVar2[1];
  param_1 = 0;
  iStack_8 = 0;
  iVar5 = DAT_004437b8;
  if (DAT_004437bc / iVar4 != -2 && -1 < DAT_004437bc / iVar4 + 2) {
    do {
      iVar7 = 0;
      iVar6 = 0;
      if (iVar5 / iVar3 != -2 && -1 < iVar5 / iVar3 + 2) {
        do {
          FUN_00421910((void *)puVar1[1],1,iVar7,param_1,0x100,0);
          iVar7 = iVar7 + iVar3;
          iVar6 = iVar6 + 1;
          iVar5 = DAT_004437b8;
        } while (iVar6 < DAT_004437b8 / iVar3 + 2);
      }
      param_1 = param_1 + iVar4;
      iStack_8 = iStack_8 + 1;
    } while (iStack_8 < DAT_004437bc / iVar4 + 2);
  }
  FUN_00421910((void *)*puVar1,0,puVar1[3],puVar1[4],0x100,0);
  FUN_00421910((void *)puVar1[1],0,puVar1[3],puVar1[4],0x100,0);
  FUN_00421910((void *)puVar1[2],0,puVar1[3],puVar1[4],0x100,0);
  return;
}
// ==== FUN_00419380 @ 00419380
void FUN_00419380(void)
{
  FUN_00420590(_DAT_00448734,(int)_DAT_00448738);
  FUN_00420500(_DAT_00448738);
  FUN_00420590(_DAT_00448734,(int)_DAT_00448730);
  FUN_00420500(_DAT_00448730);
  func_0x00420530();
  FUN_004238c0(DAT_00448150);
  return;
}
// ==== FUN_004193e0 @ 004193e0
void FUN_004193e0(void)
{
  int *piVar1;
  int iVar2;
  code *pcVar3;
  int iVar4;
  iVar4 = *(int *)(_DAT_00448734 + 4);
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
// ==== FUN_004193f0 @ 004193f0
void FUN_004193f0(void)
{
  int *piVar1;
  undefined4 *puVar2;
  code *pcVar3;
  undefined4 *puVar4;
  puVar4 = (undefined4 *)*_DAT_00448734;
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
