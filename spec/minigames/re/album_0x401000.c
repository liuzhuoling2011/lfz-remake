// ==== FUN_00401080 @ 00401080
undefined4 FUN_00401080(int param_1)
{
  int *piVar1;
  piVar1 = FUN_00420e00(s_album_bg_spr_004410cc);
  *(int **)(param_1 + 0x10) = piVar1;
  return 1;
}
// ==== FUN_004010a0 @ 004010a0
void FUN_004010a0(int param_1)
{
  FUN_00421910(*(void **)(param_1 + 0x10),0,DAT_004437b8 / 2 + -0x1e,DAT_004437bc / 2 + -0x1e,0x100,
               0);
  return;
}
// ==== FUN_004010e0 @ 004010e0
undefined4 FUN_004010e0(int param_1)
{
  undefined4 *puVar1;
  void *pvVar2;
  int *piVar3;
  undefined4 *puVar4;
  undefined4 *puVar5;
  puVar1 = _malloc(0x10);
  pvVar2 = FUN_004234f0(s_album_button1_wav_00441104,2);
  puVar1[2] = pvVar2;
  pvVar2 = FUN_004234f0(s_album_button2_wav_004410f0,2);
  puVar1[3] = pvVar2;
  piVar3 = FUN_00420e00(s_album_button_spr_004410dc);
  *puVar1 = piVar3;
  puVar4 = FUN_004230f0();
  puVar1[1] = puVar4;
  puVar4 = &DAT_0044106c;
  do {
    puVar5 = _malloc(0x20);
    puVar5[3] = *puVar1;
    puVar5[1] = DAT_004437b8 / 2;
    puVar5[2] = DAT_004437bc / 2;
    puVar5[5] = puVar4[-1];
    puVar5[6] = *puVar4;
    puVar5[7] = puVar4[1];
    puVar5[4] = puVar5[5];
    *puVar5 = 0;
    FUN_00423140((void *)puVar1[1],puVar5);
    puVar4 = puVar4 + 3;
  } while ((int)puVar4 < 0x441090);
  *(undefined4 **)(param_1 + 0x10) = puVar1;
  return 1;
}
// ==== FUN_00401190 @ 00401190
void FUN_00401190(int param_1)
{
  undefined4 *puVar1;
  int *piVar2;
  int iVar3;
  iVar3 = 0;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  piVar2 = (int *)puVar1[1];
  if (0 < *piVar2) {
    do {
      FUN_00436366(*(LPVOID *)(piVar2[1] + iVar3 * 4));
      piVar2 = (int *)puVar1[1];
      iVar3 = iVar3 + 1;
    } while (iVar3 < *piVar2);
  }
  *(undefined4 *)(*(int *)(puVar1[1] + 4) + iVar3 * 4) = 0;
  FUN_00423120((LPVOID)puVar1[1]);
  FUN_00420f10((LPVOID)*puVar1);
  FUN_00423540((LPVOID)puVar1[2]);
  FUN_00423540((LPVOID)puVar1[3]);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_00401200 @ 00401200
void FUN_00401200(int param_1)
{
  int iVar1;
  int iVar2;
  int iVar3;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = FUN_0041ee20(*(int **)(iVar1 + 4));
  FUN_0041ee90(*(int **)(iVar1 + 4),DAT_004488c4,FUN_00401260);
  iVar3 = FUN_0041ee20(*(int **)(iVar1 + 4));
  if ((iVar3 != -1) && (iVar2 != iVar3)) {
    FUN_004235b0(*(void **)(iVar1 + 0xc),0xff,0x80,0,'\0');
  }
  return;
}
// ==== FUN_00401260 @ 00401260
void FUN_00401260(int *param_1,int param_2)
{
  int iVar1;
  if (param_2 == 0) {
    FUN_004235b0(*(void **)(*(int *)(DAT_00448068 + 0x10) + 8),0xff,0x80,0,'\0');
    iVar1 = FUN_0041ee20(param_1);
    if (iVar1 == 0) {
      FUN_00423890(&DAT_00441058,0);
    }
    else {
      if (iVar1 == 1) {
        FUN_00423890(&DAT_00441058,1);
        return;
      }
      if (iVar1 == 2) {
        FUN_00423890(&DAT_004414a0,1);
        return;
      }
    }
  }
  return;
}
// ==== FUN_004012d0 @ 004012d0
void FUN_004012d0(int param_1)
{
  int iVar1;
  int iVar2;
  int *piVar3;
  int iVar4;
  iVar4 = 0;
  iVar1 = *(int *)(param_1 + 0x10);
  piVar3 = *(int **)(iVar1 + 4);
  if (0 < *piVar3) {
    do {
      iVar2 = *(int *)(piVar3[1] + iVar4 * 4);
      FUN_00421910(*(void **)(iVar2 + 0xc),*(int *)(iVar2 + 0x10),*(int *)(iVar2 + 4),
                   *(int *)(iVar2 + 8),0x100,0);
      piVar3 = *(int **)(iVar1 + 4);
      iVar4 = iVar4 + 1;
    } while (iVar4 < *piVar3);
  }
  return;
}
// ==== FUN_00401310 @ 00401310
void FUN_00401310(void)
{
  LPVOID pvVar1;
  FUN_00420a70();
  FUN_00420590(DAT_004488e0,(int)_DAT_00448064);
  FUN_00420500(_DAT_00448064);
  FUN_00420590(DAT_004488e0,(int)DAT_00448068);
  pvVar1 = DAT_00448068;
  if (DAT_00448068 != (LPVOID)0x0) {
    if (*(code **)((int)DAT_00448068 + 4) != (code *)0x0) {
      (**(code **)((int)DAT_00448068 + 4))(DAT_00448068);
    }
    FUN_00436366(pvVar1);
  }
  return;
}
// ==== FUN_00401350 @ 00401350
undefined4 FUN_00401350(undefined4 param_1)
{
  _DAT_0044806c = param_1;
  _DAT_00448064 = FUN_004204a0(0,FUN_00401080,FUN_00406c20,0,FUN_004010a0);
  FUN_00420540(DAT_004488e0,(int)_DAT_00448064,0x44c);
  _DAT_00448060 = FUN_004204a0(param_1,FUN_00401400,FUN_00401570,0,FUN_004015b0);
  FUN_00420540(DAT_004488e0,(int)_DAT_00448060,0x3f2);
  DAT_00448068 = FUN_004204a0(param_1,FUN_00401740,FUN_00401190,FUN_004017f0,FUN_004012d0);
  FUN_00420540(DAT_004488e0,(int)DAT_00448068,0x41a);
  FUN_00420a90();
  return 1;
}
// ==== FUN_00401400 @ 00401400
undefined4 FUN_00401400(int param_1,int param_2)
{
  undefined4 *puVar1;
  int *piVar2;
  int iVar3;
  undefined4 uVar4;
  puVar1 = _malloc(0x28);
  piVar2 = FUN_00420e00(s_album_frame_spr_00441118);
  *puVar1 = piVar2;
  puVar1[9] = param_2;
  uVar4 = DAT_004486c8;
  if (param_2 != 0) {
    uVar4 = DAT_00448724;
  }
  puVar1[5] = uVar4;
  puVar1[1] = 0;
  puVar1[6] = 0;
  puVar1[3] = 0;
  puVar1[4] = *(undefined4 *)(param_2 * 4 + 0x441040);
  FUN_00401480(puVar1);
  puVar1[7] = DAT_004437b8 / 2;
  iVar3 = DAT_004437bc / 2;
  puVar1[8] = iVar3;
  *(undefined4 **)(param_1 + 0x10) = puVar1;
  return CONCAT31((int3)((uint)iVar3 >> 8),1);
}
// ==== FUN_00401480 @ 00401480
void FUN_00401480(int param_1)
{
  uint *puVar1;
  undefined4 uVar2;
  char *pcVar3;
  char cVar4;
  byte abStack_100 [256];
  if (*(LPVOID *)(param_1 + 4) != (LPVOID)0x0) {
    FUN_00423eb0(*(LPVOID *)(param_1 + 4));
  }
  if (*(LPVOID *)(param_1 + 0xc) != (LPVOID)0x0) {
    FUN_00436366(*(LPVOID *)(param_1 + 0xc));
  }
  if (*(int *)(param_1 + 0x24) == 0) {
    FUN_00413220(*(int *)(param_1 + 0x18));
    FUN_00436395(abStack_100,(byte *)0x441128);
    puVar1 = FUN_00423970(abStack_100);
    *(uint **)(param_1 + 4) = puVar1;
    puVar1 = (uint *)FUN_004131f0(*(int *)(param_1 + 0x18));
    puVar1 = FUN_0043e8ea(puVar1);
    *(uint **)(param_1 + 0xc) = puVar1;
    uVar2 = FUN_004131c0(*(int *)(param_1 + 0x18));
  }
  else {
    FUN_004184c0(*(int *)(param_1 + 0x18));
    FUN_00436395(abStack_100,(byte *)0x441128);
    puVar1 = FUN_00423970(abStack_100);
    *(uint **)(param_1 + 4) = puVar1;
    puVar1 = (uint *)FUN_00418490(*(int *)(param_1 + 0x18));
    puVar1 = FUN_0043e8ea(puVar1);
    *(uint **)(param_1 + 0xc) = puVar1;
    uVar2 = FUN_00418460(*(int *)(param_1 + 0x18));
  }
  *(undefined4 *)(param_1 + 8) = uVar2;
  pcVar3 = *(char **)(param_1 + 0xc);
  if (pcVar3 != (char *)0x0) {
    cVar4 = *pcVar3;
    do {
      if ((cVar4 == '%') && (pcVar3[1] == 'd')) {
        pcVar3[1] = 's';
        return;
      }
      cVar4 = pcVar3[1];
      pcVar3 = pcVar3 + 1;
    } while (cVar4 != '\0');
  }
  return;
}
// ==== FUN_00401570 @ 00401570
void FUN_00401570(int param_1)
{
  undefined4 *puVar1;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  if ((LPVOID)puVar1[1] != (LPVOID)0x0) {
    FUN_00423eb0((LPVOID)puVar1[1]);
  }
  if ((LPVOID)puVar1[3] != (LPVOID)0x0) {
    FUN_00436366((LPVOID)puVar1[3]);
  }
  FUN_00420f10((LPVOID)*puVar1);
  FUN_00436366(puVar1);
  return;
}
// ==== FUN_004015b0 @ 004015b0
void FUN_004015b0(int param_1)
{
  int iVar1;
  undefined4 *puVar2;
  void *this;
  int iVar3;
  puVar2 = *(undefined4 **)(param_1 + 0x10);
  FUN_00424270((void *)puVar2[1],(DAT_004437b8 + -0x280) / 2 + 0xf6,
               (DAT_004437bc + -0x1e0) / 2 + 0x1d,0x100,0);
  this = (void *)*puVar2;
  FUN_00421910(this,0,puVar2[7],puVar2[8],0x100,0);
  FUN_00421910(this,1,puVar2[7],puVar2[8],0x100,0);
  FUN_00421910(this,2,puVar2[7],puVar2[8],0x100,0);
  if (puVar2[2] != 0) {
    iVar3 = DAT_004437b8 + -0x280;
    iVar1 = DAT_004437bc + -0x1e0;
    *(undefined1 *)((int)DAT_004488d8 + 0xd) = 1;
    *(undefined1 *)((int)DAT_004488d8 + 0xc) = 1;
    FUN_00424500(DAT_004488d8,0xff,0xca,0);
    FUN_00424600((int)DAT_004488d8,iVar3 / 2 + 100,(byte *)(iVar1 / 2 + 0x15e),0x1ef,
                 (byte *)puVar2[2]);
  }
  if (puVar2[3] != 0) {
    iVar3 = DAT_004437b8 + -0x280;
    iVar1 = DAT_004437bc + -0x1e0;
    *(undefined1 *)((int)DAT_004488d8 + 0xd) = 1;
    *(undefined1 *)((int)DAT_004488d8 + 0xc) = 1;
    FUN_00424500(DAT_004488d8,0xff,0xff,0xff);
    FUN_00424600((int)DAT_004488d8,iVar3 / 2 + 0x50,(byte *)(iVar1 / 2 + 0x18b),0x1ef,
                 (byte *)puVar2[3]);
  }
  return;
}
// ==== FUN_00401740 @ 00401740
undefined4 FUN_00401740(int param_1)
{
  undefined4 *puVar1;
  void *pvVar2;
  int *piVar3;
  undefined4 *puVar4;
  puVar1 = _malloc(0x10);
  pvVar2 = FUN_004234f0(s_album_button1_wav_00441104,2);
  puVar1[2] = pvVar2;
  pvVar2 = FUN_004234f0(s_album_button2_wav_004410f0,2);
  puVar1[3] = pvVar2;
  piVar3 = FUN_00420e00(s_album_button2_spr_00441134);
  *puVar1 = piVar3;
  puVar4 = FUN_004230f0();
  puVar1[1] = puVar4;
  puVar4 = (undefined4 *)&DAT_00441090;
  do {
    pvVar2 = _malloc(0x20);
    *(undefined4 *)((int)pvVar2 + 0xc) = *puVar1;
    *(int *)((int)pvVar2 + 4) = DAT_004437b8 / 2;
    *(int *)((int)pvVar2 + 8) = DAT_004437bc / 2;
    *(undefined4 *)((int)pvVar2 + 0x14) = puVar4[-1];
    *(undefined4 *)((int)pvVar2 + 0x18) = *puVar4;
    *(undefined4 *)((int)pvVar2 + 0x1c) = puVar4[1];
    *(undefined4 *)((int)pvVar2 + 0x10) = *(undefined4 *)((int)pvVar2 + 0x14);
    FUN_00423140((void *)puVar1[1],pvVar2);
    puVar4 = puVar4 + 3;
  } while ((int)puVar4 < 0x4410b4);
  *(undefined4 **)(param_1 + 0x10) = puVar1;
  return 1;
}
// ==== FUN_004017f0 @ 004017f0
void FUN_004017f0(int param_1)
{
  int iVar1;
  int iVar2;
  int iVar3;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = FUN_0041ee20(*(int **)(iVar1 + 4));
  FUN_0041ee90(*(int **)(iVar1 + 4),DAT_004488c4,FUN_00401850);
  iVar3 = FUN_0041ee20(*(int **)(iVar1 + 4));
  if ((iVar3 != -1) && (iVar2 != iVar3)) {
    FUN_004235b0(*(void **)(iVar1 + 0xc),0xff,0x80,0,'\0');
  }
  return;
}
// ==== FUN_00401850 @ 00401850
void FUN_00401850(int *param_1,int param_2)
{
  int iVar1;
  if (param_2 == 0) {
    FUN_004235b0(*(void **)(*(int *)(DAT_00448068 + 0x10) + 8),0xff,0x80,0,'\0');
    iVar1 = FUN_0041ee20(param_1);
    if (iVar1 == 0) {
      iVar1 = *(int *)(_DAT_00448060 + 0x10);
      *(int *)(iVar1 + 0x18) =
           (*(int *)(iVar1 + 0x18) + -1 + *(int *)(iVar1 + 0x14)) % *(int *)(iVar1 + 0x14);
      FUN_00401480(iVar1);
      return;
    }
    if (iVar1 == 1) {
      iVar1 = *(int *)(_DAT_00448060 + 0x10);
      *(int *)(iVar1 + 0x18) = (*(int *)(iVar1 + 0x18) + 1) % *(int *)(iVar1 + 0x14);
      FUN_00401480(iVar1);
      return;
    }
    if (iVar1 == 2) {
      FUN_00423890(0x441048,0);
    }
  }
  return;
}
// ==== FUN_00401900 @ 00401900
void FUN_00401900(void)
{
  LPVOID pvVar1;
  FUN_00420a70();
  FUN_00420590(DAT_004488e0,(int)_DAT_00448060);
  FUN_00420500(_DAT_00448060);
  FUN_00420590(DAT_004488e0,(int)_DAT_00448064);
  FUN_00420500(_DAT_00448064);
  FUN_00420590(DAT_004488e0,(int)DAT_00448068);
  pvVar1 = DAT_00448068;
  if (DAT_00448068 != (LPVOID)0x0) {
    if (*(code **)((int)DAT_00448068 + 4) != (code *)0x0) {
      (**(code **)((int)DAT_00448068 + 4))(DAT_00448068);
    }
    FUN_00436366(pvVar1);
  }
  return;
}
