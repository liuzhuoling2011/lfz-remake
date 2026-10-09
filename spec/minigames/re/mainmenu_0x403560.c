// ==== FUN_00403560 @ 00403560
undefined4 FUN_00403560(int param_1)
{
  uint *puVar1;
  _DAT_00441458 = 0xffffffff;
  _DAT_004480ec = FUN_004204a0(0,FUN_00403960,FUN_004039f0,FUN_00403a60,FUN_00403c00);
  FUN_00420540(DAT_004488e0,(int)_DAT_004480ec,1000);
  _DAT_004480e0 = FUN_004204a0(_DAT_004480f4,FUN_00403640,FUN_004036f0,FUN_00403720,FUN_004038f0);
  FUN_00420540(DAT_004488e0,(int)_DAT_004480e0,0x3f2);
  DAT_004480e8 = 0;
  FUN_00420a90();
  if (param_1 == 0) {
    FUN_0040ee20();
    FUN_00420540(DAT_004488e0,_DAT_004486a4,999);
    FUN_00425790(DAT_00448888,s_Music_00441318);
    puVar1 = (uint *)FUN_00425860(DAT_00448888,s_MainMenu_004414b0,0);
    FUN_0040ed40(puVar1);
  }
  return 1;
}
// ==== FUN_00403640 @ 00403640
undefined4 FUN_00403640(int param_1,int param_2)
{
  int *piVar1;
  void *pvVar2;
  int *piVar3;
  int iVar4;
  int iVar5;
  piVar1 = _malloc(0x58);
  pvVar2 = FUN_004234f0(s_dat_MainMenu_click_wav_004414ec,2);
  piVar1[0x14] = (int)pvVar2;
  pvVar2 = FUN_004234f0(s_dat_MainMenu_button_wav_004414d4,2);
  piVar1[0x15] = (int)pvVar2;
  piVar3 = FUN_00420e00(s_dat_MainMenu_menu_spr_004414bc);
  piVar1[3] = (int)piVar3;
  iVar5 = 0x50;
  iVar4 = 8;
  piVar3 = piVar1 + 8;
  do {
    iVar4 = iVar4 + 4;
    piVar3[-1] = *(int *)(*(int *)(piVar1[3] + 0xc) + -4 + iVar4);
    *piVar3 = iVar5;
    iVar5 = iVar5 + 0x5f;
    piVar3 = piVar3 + 2;
  } while (iVar4 < 0x20);
  piVar1[0x13] = DAT_004488c4;
  piVar1[4] = param_2;
  *piVar1 = (DAT_004437b8 + -0x280) / 2;
  piVar1[5] = piVar1[param_2 * 2 + 8];
  iVar4 = DAT_004437bc + -0x32;
  piVar1[2] = iVar4;
  piVar1[1] = iVar4;
  *(int **)(param_1 + 0x10) = piVar1;
  return CONCAT31((int3)((uint)iVar4 >> 8),1);
}
// ==== FUN_004036f0 @ 004036f0
void FUN_004036f0(int param_1)
{
  LPVOID pvVar1;
  pvVar1 = *(LPVOID *)(param_1 + 0x10);
  FUN_00423540(*(LPVOID *)((int)pvVar1 + 0x50));
  FUN_00423540(*(LPVOID *)((int)pvVar1 + 0x54));
  FUN_00420f10(*(LPVOID *)((int)pvVar1 + 0xc));
  FUN_00436366(pvVar1);
  return;
}
// ==== FUN_00403720 @ 00403720
void FUN_00403720(uint param_1)
{
  int *piVar1;
  uint uVar2;
  uint uVar3;
  char *pcVar4;
  uint *puVar5;
  int *piVar6;
  int iVar7;
  undefined4 uVar8;
  int iStack_4;
  uVar2 = param_1;
  piVar1 = *(int **)(param_1 + 0x10);
  FUN_00420dc0(piVar1[0x13],&iStack_4,&param_1);
  iVar7 = 0;
  piVar6 = piVar1 + 7;
  do {
    uVar3 = FUN_00420f30((void *)*piVar6,piVar6[1] + *piVar1,piVar1[1],iStack_4,param_1);
    if ((char)uVar3 != '\0') {
      if (piVar1[4] != iVar7) {
        FUN_004235b0((void *)piVar1[0x15],0xff,0x80,0,'\0');
      }
      piVar1[4] = iVar7;
    }
    iVar7 = iVar7 + 1;
    piVar6 = piVar6 + 2;
  } while (iVar7 < 6);
  iVar7 = FUN_0040e970(piVar1[5],piVar1[piVar1[4] * 2 + 8],4);
  piVar1[5] = piVar1[5] + iVar7;
  pcVar4 = (char *)FUN_00426a80(piVar1[0x13]);
  if (((pcVar4 != (char *)0x0) && (pcVar4[1] == '\x01')) && (*pcVar4 == '\0')) {
    uVar3 = FUN_00420f30((void *)**(undefined4 **)(piVar1[3] + 0xc),piVar1[5] + *piVar1,piVar1[1],
                         iStack_4,param_1);
    if ((char)uVar3 != '\0') {
      FUN_004235b0((void *)piVar1[0x14],0xff,0x80,0,'\0');
      _DAT_004480f4 = piVar1[4];
      if (_DAT_004480f4 != 4) {
        if (_DAT_004480f4 != 5) {
          DAT_004480e8 = 1;
          return;
        }
        FUN_00425790(DAT_00448888,&DAT_00441510);
        uVar8 = 3;
        iVar7 = DAT_004488c4;
        puVar5 = (uint *)FUN_00425860(DAT_00448888,s_ExitGame_00441504,0);
        FUN_0040b850(puVar5,uVar8,iVar7);
        *(code **)(uVar2 + 8) = FUN_004038c0;
        return;
      }
      FUN_0040a6b0(0,DAT_004488c4);
      *(code **)(uVar2 + 8) = FUN_00403890;
    }
  }
  return;
}
// ==== FUN_00403890 @ 00403890
void FUN_00403890(int param_1)
{
  _DAT_00441458 = FUN_0040b3d0();
  if (_DAT_00441458 != -2) {
    if (_DAT_00441458 == -1) {
      *(code **)(param_1 + 8) = FUN_00403720;
      return;
    }
    DAT_004480e8 = 1;
  }
  return;
}
// ==== FUN_004038c0 @ 004038c0
void FUN_004038c0(int param_1)
{
  int iVar1;
  iVar1 = FUN_0040bd80();
  if (iVar1 == 1) {
    FUN_0040bd60();
    DAT_004480e8 = 1;
  }
  else if (iVar1 == 2) {
    FUN_0040bd60();
    *(code **)(param_1 + 8) = FUN_00403720;
    return;
  }
  return;
}
// ==== FUN_004038f0 @ 004038f0
void FUN_004038f0(int param_1)
{
  int *piVar1;
  int iVar2;
  int *piVar3;
  piVar1 = *(int **)(param_1 + 0x10);
  FUN_00421910((void *)piVar1[3],0,piVar1[5] + *piVar1,piVar1[1],0x100,0);
  piVar3 = piVar1 + 7;
  iVar2 = 6;
  do {
    FUN_00421410((void *)*piVar3,piVar3[1] + *piVar1,piVar1[1],0x100,0);
    piVar3 = piVar3 + 2;
    iVar2 = iVar2 + -1;
  } while (iVar2 != 0);
  FUN_00421910((void *)piVar1[3],1,piVar1[5] + *piVar1,piVar1[1],0x100,0);
  return;
}
// ==== FUN_00403960 @ 00403960
undefined4 FUN_00403960(int param_1)
{
  undefined4 uVar1;
  undefined4 *puVar2;
  DWORD DVar3;
  int *piVar4;
  undefined4 *puVar5;
  puVar2 = _malloc(0x2c);
  DVar3 = GetTickCount();
  puVar2[10] = DVar3 + 30000;
  puVar2[9] = 0xffffffff;
  puVar2[8] = 0xffffffff;
  piVar4 = FUN_00420e00(s_dat_MainMenu_bg_spr_00441550);
  *puVar2 = piVar4;
  piVar4 = FUN_00420e00(s_dat_MainMenu_money01_spr_00441534);
  puVar2[1] = piVar4;
  piVar4 = FUN_00420e00(s_dat_MainMenu_money02_spr_00441518);
  puVar2[2] = piVar4;
  puVar5 = FUN_004230f0();
  puVar2[3] = puVar5;
  puVar2[6] = DAT_004437b8 / 2;
  puVar2[7] = DAT_004437b8 / 2 + 0x50;
  uVar1 = puVar2[6];
  puVar2[4] = uVar1;
  puVar2[5] = puVar2[7];
  *(undefined4 **)(param_1 + 0x10) = puVar2;
  return CONCAT31((int3)((uint)uVar1 >> 8),1);
}
// ==== FUN_004039f0 @ 004039f0
void FUN_004039f0(int param_1)
{
  undefined4 *puVar1;
  int *piVar2;
  int iVar3;
  iVar3 = 0;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  piVar2 = (int *)puVar1[3];
  if (0 < *piVar2) {
    do {
      FUN_00436366(*(LPVOID *)(piVar2[1] + iVar3 * 4));
      piVar2 = (int *)puVar1[3];
      iVar3 = iVar3 + 1;
    } while (iVar3 < *piVar2);
  }
  *(undefined4 *)(*(int *)(puVar1[3] + 4) + iVar3 * 4) = 0;
  FUN_00423120((LPVOID)puVar1[3]);
  FUN_00420f10((LPVOID)puVar1[2]);
  FUN_00420f10((LPVOID)puVar1[1]);
  FUN_00420f10((LPVOID)*puVar1);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_00403a60 @ 00403a60
void FUN_00403a60(int param_1)
{
  int iVar1;
  DWORD DVar2;
  int iStack_4;
  iVar1 = *(int *)(param_1 + 0x10);
  FUN_00403af0(iVar1);
  FUN_00403b80(*(undefined4 *)(iVar1 + 0xc));
  FUN_00420dc0(DAT_004488c4,&param_1,&iStack_4);
  if ((*(int *)(iVar1 + 0x20) != param_1) || (*(int *)(iVar1 + 0x24) != iStack_4)) {
    DVar2 = GetTickCount();
    *(DWORD *)(iVar1 + 0x28) = DVar2 + 30000;
    *(int *)(iVar1 + 0x20) = param_1;
    *(int *)(iVar1 + 0x24) = iStack_4;
  }
  DVar2 = GetTickCount();
  if (*(uint *)(iVar1 + 0x28) < DVar2) {
    _DAT_004480f4 = 0xffffffff;
    DAT_004480e8 = 1;
  }
  return;
}
// ==== FUN_00403af0 @ 00403af0
int * FUN_00403af0(int param_1)
{
  uint uVar1;
  int *piVar2;
  undefined4 *puVar3;
  piVar2 = *(int **)(param_1 + 0xc);
  if (*piVar2 < 0x28) {
    uVar1 = FUN_00436815();
    piVar2 = (int *)((int)uVar1 / 10);
    if ((int)uVar1 % 10 == 0) {
      puVar3 = _malloc(0x18);
      uVar1 = FUN_00436815();
      uVar1 = uVar1 & 0x80000001;
      if ((int)uVar1 < 0) {
        uVar1 = (uVar1 - 1 | 0xfffffffe) + 1;
      }
      *puVar3 = *(undefined4 *)(param_1 + 4 + uVar1 * 4);
      uVar1 = FUN_00436815();
      uVar1 = uVar1 & 0x80000007;
      if ((int)uVar1 < 0) {
        uVar1 = (uVar1 - 1 | 0xfffffff8) + 1;
      }
      puVar3[3] = uVar1;
      uVar1 = FUN_00436815();
      puVar3[4] = 0;
      puVar3[2] = 0;
      puVar3[5] = ((int)uVar1 % 3 + 1) * 5;
      uVar1 = FUN_00436815();
      puVar3[1] = (int)uVar1 % DAT_004437b8;
      piVar2 = (int *)FUN_00423140(*(void **)(param_1 + 0xc),puVar3);
    }
  }
  return piVar2;
}
// ==== FUN_00403b80 @ 00403b80
void FUN_00403b80(int *param_1)
{
  int iVar1;
  int iVar2;
  int iVar3;
  iVar3 = 0;
  if (0 < *param_1) {
    do {
      iVar1 = *(int *)(param_1[1] + iVar3 * 4);
      iVar2 = *(int *)(iVar1 + 0x10) + 1;
      *(int *)(iVar1 + 0x10) = iVar2;
      if (iVar2 == *(int *)(iVar1 + 0x14)) {
        *(undefined4 *)(iVar1 + 0x10) = 0;
        *(undefined4 *)(iVar1 + 0xc) = *(undefined4 *)(*(int *)(iVar1 + 0xc) * 4 + 0x44147c);
      }
      iVar2 = *(int *)(iVar1 + 8) + *(int *)(iVar1 + 0x14) / 2;
      *(int *)(iVar1 + 8) = iVar2;
      if (DAT_004437bc + 0x1e < iVar2) {
        FUN_00436366(*(LPVOID *)(param_1[1] + iVar3 * 4));
        *(undefined4 *)(param_1[1] + iVar3 * 4) = 0;
        FUN_00423190(param_1,iVar3);
      }
      iVar3 = iVar3 + 1;
    } while (iVar3 < *param_1);
  }
  return;
}
// ==== FUN_00403c00 @ 00403c00
void FUN_00403c00(int param_1)
{
  undefined4 *puVar1;
  uint uVar2;
  byte *pbVar3;
  int iVar4;
  byte *pbVar5;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00421910((void *)*puVar1,0,puVar1[4],puVar1[5],0x100,0);
  FUN_00403cf0(puVar1[3]);
  FUN_00421910((void *)*puVar1,2,puVar1[4],DAT_004437bc + -0x32,0x100,0);
  FUN_00421910((void *)*puVar1,1,puVar1[4],
               ((int)(DAT_004437bc + (DAT_004437bc >> 0x1f & 3U)) >> 2) + 100,0x100,0);
  FUN_00424500(_DAT_004488d4,0xff,0xff,0xff);
  *(undefined1 *)((int)_DAT_004488d4 + 0xd) = 1;
  FUN_00424530(_DAT_004488d4,0,0,0);
  pbVar5 = (byte *)0x44357c;
  pbVar3 = (byte *)(DAT_004437bc + -0x14);
  iVar4 = -1;
  uVar2 = FUN_00424560((int)_DAT_004488d4,(byte *)0x44357c);
  FUN_00424600((int)_DAT_004488d4,(DAT_004437b8 - uVar2) + -10,pbVar3,iVar4,pbVar5);
  return;
}
// ==== FUN_00403cf0 @ 00403cf0
void FUN_00403cf0(int *param_1)
{
  undefined4 *puVar1;
  int iVar2;
  iVar2 = 0;
  if (0 < *param_1) {
    do {
      puVar1 = *(undefined4 **)(param_1[1] + iVar2 * 4);
      FUN_00421910((void *)*puVar1,*(int *)(puVar1[3] * 4 + 0x44145c),puVar1[1],puVar1[2],0x100,0);
      iVar2 = iVar2 + 1;
    } while (iVar2 < *param_1);
  }
  return;
}
// ==== FUN_00403d30 @ 00403d30
void FUN_00403d30(void)
{
  Sleep(0x14);
  FUN_00420590(DAT_004488e0,(int)_DAT_004480e0);
  FUN_00420500(_DAT_004480e0);
  FUN_00420590(DAT_004488e0,(int)_DAT_004480ec);
  FUN_00420500(_DAT_004480ec);
  if (DAT_004488f0 != '\0') {
    *(undefined1 *)(DAT_004488e4 + 0x19) = 0;
    *(undefined1 *)(DAT_004488e4 + 0x18) = 0;
  }
  return;
}
// ==== FUN_00403d80 @ 00403d80
void FUN_00403d80(void)
{
  func_0x004205c0();
  if (DAT_004480e8 != '\0') {
    switch(_DAT_004480f4) {
    case 0:
      FUN_00423890(0x4415f8,0);
      return;
    case 1:
      FUN_00423890(0x441048,0);
      return;
    case 2:
      FUN_00423890(0x441880,1);
      return;
    case 3:
      FUN_00423890(0x441880,0);
      return;
    case 4:
      FUN_00420590(DAT_004488e0,_DAT_004486a4);
      func_0x0040ef50();
      FUN_00423890(&DAT_004411b0,_DAT_00441458);
      return;
    case 5:
      FUN_00420590(DAT_004488e0,_DAT_004486a4);
      func_0x0040ef50();
      DAT_00448c58 = 1;
      return;
    case 0xffffffff:
      FUN_00420590(DAT_004488e0,_DAT_004486a4);
      func_0x0040ef50();
      FUN_0040edb0();
      FUN_00423890(0x4411f0,0);
      _DAT_004480f4 = 0;
      return;
    default:
      DAT_004480e8 = '\0';
    }
  }
  return;
}
