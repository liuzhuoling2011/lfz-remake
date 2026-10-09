// ==== FUN_00406d40 @ 00406d40
undefined4 FUN_00406d40(void)
{
  _DAT_004481c8 = FUN_004204a0(0,FUN_00406db0,FUN_00406e70,FUN_00406ee0,FUN_00407000);
  FUN_00420540(DAT_004488e0,(int)_DAT_004481c8,1000);
  _DAT_004481cc = FUN_004204a0(0,FUN_00407050,FUN_004070f0,0,FUN_00407140);
  FUN_00420540(DAT_004488e0,(int)_DAT_004481cc,0x3fc);
  FUN_00420a90();
  return 1;
}
// ==== FUN_00406db0 @ 00406db0
undefined4 FUN_00406db0(int param_1)
{
  undefined4 *puVar1;
  void *pvVar2;
  int *piVar3;
  undefined4 *puVar4;
  undefined4 *puVar5;
  puVar1 = _malloc(0x18);
  pvVar2 = FUN_004234f0(s_dat_SelectMiniGame_dan01_wav_00441b04,2);
  puVar1[1] = pvVar2;
  pvVar2 = FUN_004234f0(s_dat_SelectMiniGame_button_wav_00441ae4,2);
  puVar1[2] = pvVar2;
  piVar3 = FUN_00420e00(s_dat_SelectMiniGame_bg_spr_00441ac8);
  *puVar1 = piVar3;
  puVar4 = FUN_004230f0();
  puVar1[3] = puVar4;
  puVar4 = (undefined4 *)0x441a8c;
  do {
    puVar5 = _malloc(0x20);
    puVar5[1] = DAT_004437b8 / 2;
    puVar5[2] = DAT_004437bc / 2;
    puVar5[3] = *puVar1;
    puVar5[5] = puVar4[-1];
    puVar5[6] = *puVar4;
    puVar5[7] = puVar4[1];
    puVar5[4] = puVar5[5];
    *puVar5 = 0;
    FUN_00423140((void *)puVar1[3],puVar5);
    puVar4 = puVar4 + 3;
  } while ((int)puVar4 < 0x441abc);
  *(undefined1 *)(puVar1 + 4) = 0;
  puVar1[5] = 0;
  *(undefined4 **)(param_1 + 0x10) = puVar1;
  return 1;
}
// ==== FUN_00406e70 @ 00406e70
void FUN_00406e70(int param_1)
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
  FUN_00420f10((LPVOID)*puVar1);
  FUN_00423540((LPVOID)puVar1[1]);
  FUN_00423540((LPVOID)puVar1[2]);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_00406ee0 @ 00406ee0
void FUN_00406ee0(int param_1)
{
  int iVar1;
  int iVar2;
  int iVar3;
  iVar1 = *(int *)(param_1 + 0x10);
  if (*(char *)(iVar1 + 0x10) != '\0') {
    FUN_00420a90();
    FUN_00426ad0(DAT_004488c4);
    FUN_0041e3d0();
    *(undefined1 *)(iVar1 + 0x10) = 0;
    FUN_0040ee00();
  }
  if (*(int *)(iVar1 + 0x14) < 1) {
    iVar2 = FUN_0041ee20(*(int **)(iVar1 + 0xc));
    FUN_0041ee90(*(int **)(iVar1 + 0xc),DAT_004488c4,FUN_00406f80);
    iVar3 = FUN_0041ee20(*(int **)(iVar1 + 0xc));
    if ((iVar3 != -1) && (iVar3 != iVar2)) {
      FUN_004235b0(*(void **)(iVar1 + 4),0xff,0x80,0,'\0');
    }
  }
  else {
    iVar2 = *(int *)(iVar1 + 0x14) + -1;
    *(int *)(iVar1 + 0x14) = iVar2;
    if (iVar2 == 0) {
      FUN_00426ad0(DAT_004488c4);
      return;
    }
  }
  return;
}
// ==== FUN_00406f80 @ 00406f80
void FUN_00406f80(int *param_1,int param_2)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(_DAT_004481c8 + 0x10);
  if (param_2 == 0) {
    FUN_004235b0(*(void **)(iVar1 + 8),0xff,0x80,0,'\0');
    iVar2 = FUN_0041ee20(param_1);
    if (-1 < iVar2) {
      if (iVar2 < 4) {
        *(undefined4 *)(iVar1 + 0x14) = 0x50;
        *(undefined1 *)(iVar1 + 0x10) = 1;
        FUN_0040edf0();
        FUN_004238d0(0x4433d0,*(undefined4 *)(iVar2 * 4 + 0x441a78));
      }
      else if (iVar2 == 4) {
        FUN_00423890(&DAT_004414a0,1);
        return;
      }
    }
  }
  return;
}
// ==== FUN_00407000 @ 00407000
void FUN_00407000(int param_1)
{
  int iVar1;
  int iVar2;
  int *piVar3;
  int iVar4;
  iVar4 = 0;
  iVar1 = *(int *)(param_1 + 0x10);
  piVar3 = *(int **)(iVar1 + 0xc);
  if (*piVar3 != 1 && -1 < *piVar3 + -1) {
    do {
      iVar2 = *(int *)(piVar3[1] + iVar4 * 4);
      FUN_00421910(*(void **)(iVar2 + 0xc),*(int *)(iVar2 + 0x10),*(int *)(iVar2 + 4),
                   *(int *)(iVar2 + 8),0x100,0);
      piVar3 = *(int **)(iVar1 + 0xc);
      iVar4 = iVar4 + 1;
    } while (iVar4 < *piVar3 + -1);
  }
  return;
}
// ==== FUN_00407050 @ 00407050
undefined4 FUN_00407050(int param_1)
{
  undefined4 *puVar1;
  int *piVar2;
  void *pvVar3;
  int iVar4;
  iVar4 = *(int *)(_DAT_004481c8 + 0x10);
  puVar1 = _malloc(0xc);
  piVar2 = FUN_00420e00(s_dat_SelectMiniGame_fg_spr_00441b24);
  *puVar1 = piVar2;
  pvVar3 = _malloc(0x20);
  puVar1[1] = pvVar3;
  *(int *)((int)pvVar3 + 4) = DAT_004437b8 / 2;
  *(int *)(puVar1[1] + 8) = DAT_004437bc / 2;
  *(undefined4 *)(puVar1[1] + 0xc) = *puVar1;
  *(undefined4 *)(puVar1[1] + 0x14) = 2;
  *(undefined4 *)(puVar1[1] + 0x18) = 3;
  *(undefined4 *)(puVar1[1] + 0x1c) = 4;
  *(undefined4 *)(puVar1[1] + 0x10) = 2;
  *(undefined4 *)puVar1[1] = 0;
  iVar4 = FUN_00423140(*(void **)(iVar4 + 0xc),puVar1[1]);
  puVar1[2] = iVar4;
  *(undefined4 **)(param_1 + 0x10) = puVar1;
  return 1;
}
// ==== FUN_004070f0 @ 004070f0
void FUN_004070f0(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00423190(*(void **)(*(int *)(_DAT_004481c8 + 0x10) + 0xc),puVar1[2]);
  FUN_00436366((LPVOID)puVar1[1]);
  puVar1[1] = 0;
  FUN_00420f10((LPVOID)*puVar1);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_00407140 @ 00407140
void FUN_00407140(int param_1)
{
  undefined4 *puVar1;
  int iVar2;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00421910((void *)*puVar1,0,DAT_004437b8 / 2,DAT_004437bc / 2,0x100,0);
  FUN_00421910((void *)*puVar1,1,DAT_004437b8 / 2,DAT_004437bc / 2,0x100,0);
  iVar2 = puVar1[1];
  FUN_00421910(*(void **)(iVar2 + 0xc),*(int *)(iVar2 + 0x10),*(int *)(iVar2 + 4),
               *(int *)(iVar2 + 8),0x100,0);
  return;
}
// ==== FUN_004071c0 @ 004071c0
void FUN_004071c0(void)
{
  LPVOID pvVar1;
  FUN_00420a70();
  FUN_00420590(DAT_004488e0,(int)_DAT_004481cc);
  FUN_00420500(_DAT_004481cc);
  FUN_00420590(DAT_004488e0,(int)_DAT_004481c8);
  pvVar1 = _DAT_004481c8;
  if (_DAT_004481c8 != (LPVOID)0x0) {
    if (*(code **)((int)_DAT_004481c8 + 4) != (code *)0x0) {
      (**(code **)((int)_DAT_004481c8 + 4))(_DAT_004481c8);
    }
    FUN_00436366(pvVar1);
  }
  return;
}
