// ==== FUN_00418400 @ 00418400
void FUN_00418400(void)
{
  undefined4 *puVar1;
  LPVOID pvVar2;
  int *piVar3;
  int iVar4;
  pvVar2 = DAT_00448728;
  if (DAT_00448728 != (LPVOID)0x0) {
    piVar3 = *(int **)((int)DAT_00448728 + 0x10);
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
// ==== FUN_00418410 @ 00418410
undefined4 __cdecl FUN_00418410(int param_1)
{
  byte *_Str1;
  int iVar1;
  undefined4 uVar2;
  void *this;
  FUN_00425800(DAT_00448728,param_1);
  _Str1 = (byte *)FUN_00425860(DAT_00448728,s_result_0044290c,0);
  iVar1 = __strcmpi((char *)_Str1,s_default_004428f8);
  if (iVar1 == 0) {
    return 0xffffffff;
  }
  uVar2 = FUN_004367b0(this,_Str1);
  return uVar2;
}
// ==== FUN_00418460 @ 00418460
void __cdecl FUN_00418460(int param_1)
{
  FUN_00425800(DAT_00448728,param_1);
  FUN_00425860(DAT_00448728,s_title_004421b0,0);
  return;
}
// ==== FUN_00418490 @ 00418490
void __cdecl FUN_00418490(int param_1)
{
  FUN_00425800(DAT_00448728,param_1);
  FUN_00425860(DAT_00448728,&DAT_00442914,0);
  return;
}
// ==== FUN_004184c0 @ 004184c0
void __cdecl FUN_004184c0(int param_1)
{
  FUN_00425800(DAT_00448728,param_1);
  FUN_00425860(DAT_00448728,&DAT_0044291c,0);
  return;
}
// ==== FUN_004184f0 @ 004184f0
void __cdecl FUN_004184f0(int param_1)
{
  byte *pbVar1;
  void *this;
  FUN_00425800(DAT_00448728,param_1);
  pbVar1 = (byte *)FUN_00425860(DAT_00448728,s_selectPlayer_00442e90,0);
  FUN_004367b0(this,pbVar1);
  return;
}
// ==== FUN_00418520 @ 00418520
void __cdecl FUN_00418520(int param_1)
{
  int iVar1;
  undefined4 uVar2;
  if (DAT_0044872c != (undefined4 *)0x0) {
    FUN_00418820();
  }
  DAT_0044872c = FUN_004204a0(param_1,FUN_00418570,FUN_0040bf70,FUN_00418660,FUN_00418730);
  iVar1 = DAT_0044872c[4];
  uVar2 = FUN_00418460(param_1);
  *(undefined4 *)(iVar1 + 0x14) = uVar2;
  uVar2 = FUN_00418490(param_1);
  *(undefined4 *)(iVar1 + 0x10) = uVar2;
  return;
}
// ==== FUN_00418570 @ 00418570
undefined4 FUN_00418570(int param_1,int param_2)
{
  char cVar1;
  byte bVar2;
  undefined4 *puVar3;
  int *piVar4;
  char *pcVar5;
  uint *puVar6;
  uint uVar7;
  uint uVar8;
  int iVar9;
  byte *pbVar10;
  char *pcVar11;
  byte *pbVar12;
  byte abStack_100 [256];
  puVar3 = _malloc(0x30);
  piVar4 = FUN_00420e00(s_dat_interface_chance_spr_00442104);
  *puVar3 = piVar4;
  uVar7 = 0xffffffff;
  puVar3[7] = *(int *)(*(int *)piVar4[3] + 4) / 2;
  puVar3[2] = DAT_004437b8 / 2;
  puVar3[3] = -puVar3[7];
  puVar3[4] = 0;
  pcVar5 = s_dat_WordCard__004420e4;
  do {
    pcVar11 = pcVar5;
    if (uVar7 == 0) break;
    uVar7 = uVar7 - 1;
    pcVar11 = pcVar5 + 1;
    cVar1 = *pcVar5;
    pcVar5 = pcVar11;
  } while (cVar1 != '\0');
  uVar7 = ~uVar7;
  pbVar10 = (byte *)(pcVar11 + -uVar7);
  pbVar12 = abStack_100;
  for (uVar8 = uVar7 >> 2; uVar8 != 0; uVar8 = uVar8 - 1) {
    *(undefined4 *)pbVar12 = *(undefined4 *)pbVar10;
    pbVar10 = pbVar10 + 4;
    pbVar12 = pbVar12 + 4;
  }
  for (uVar7 = uVar7 & 3; uVar7 != 0; uVar7 = uVar7 - 1) {
    *pbVar12 = *pbVar10;
    pbVar10 = pbVar10 + 1;
    pbVar12 = pbVar12 + 1;
  }
  pcVar5 = (char *)FUN_004184c0(param_2);
  uVar7 = 0xffffffff;
  do {
    pcVar11 = pcVar5;
    if (uVar7 == 0) break;
    uVar7 = uVar7 - 1;
    pcVar11 = pcVar5 + 1;
    cVar1 = *pcVar5;
    pcVar5 = pcVar11;
  } while (cVar1 != '\0');
  uVar7 = ~uVar7;
  iVar9 = -1;
  pbVar10 = abStack_100;
  do {
    pbVar12 = pbVar10;
    if (iVar9 == 0) break;
    iVar9 = iVar9 + -1;
    pbVar12 = pbVar10 + 1;
    bVar2 = *pbVar10;
    pbVar10 = pbVar12;
  } while (bVar2 != 0);
  pbVar10 = (byte *)(pcVar11 + -uVar7);
  pbVar12 = pbVar12 + -1;
  for (uVar8 = uVar7 >> 2; uVar8 != 0; uVar8 = uVar8 - 1) {
    *(undefined4 *)pbVar12 = *(undefined4 *)pbVar10;
    pbVar10 = pbVar10 + 4;
    pbVar12 = pbVar12 + 4;
  }
  for (uVar7 = uVar7 & 3; uVar7 != 0; uVar7 = uVar7 - 1) {
    *pbVar12 = *pbVar10;
    pbVar10 = pbVar10 + 1;
    pbVar12 = pbVar12 + 1;
  }
  puVar6 = FUN_00423970(abStack_100);
  puVar3[1] = puVar6;
  puVar3[6] = 0;
  *(undefined1 *)(puVar3 + 8) = 1;
  FUN_00420540(DAT_004488e0,param_1,10000);
  *(undefined4 **)(param_1 + 0x10) = puVar3;
  return 1;
}
// ==== FUN_00418660 @ 00418660
void FUN_00418660(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = FUN_0040e970(*(int *)(iVar1 + 0xc),DAT_004437bc / 2,8);
  if (iVar2 == 0) {
    *(code **)(param_1 + 8) = FUN_004186a0;
    return;
  }
  *(int *)(iVar1 + 0xc) = *(int *)(iVar1 + 0xc) + iVar2;
  return;
}
// ==== FUN_004186a0 @ 004186a0
void FUN_004186a0(int param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)(param_1 + 0x10);
  iVar2 = *(int *)(iVar1 + 0x18) + 1;
  *(int *)(iVar1 + 0x18) = iVar2;
  if (0x78 < iVar2) {
    *(undefined4 *)(iVar1 + 0x2c) = 2;
    *(code **)(param_1 + 8) = FUN_004186d0;
  }
  return;
}
// ==== FUN_004186d0 @ 004186d0
void FUN_004186d0(LPVOID param_1)
{
  int iVar1;
  int iVar2;
  iVar1 = *(int *)((int)param_1 + 0x10);
  if (*(char *)(iVar1 + 0x20) == '\0') {
    FUN_00420500(param_1);
    DAT_0044872c = 0;
    return;
  }
  iVar2 = *(int *)(iVar1 + 0x2c);
  *(int *)(iVar1 + 0xc) = *(int *)(iVar1 + 0xc) + iVar2;
  *(int *)(iVar1 + 0x2c) = iVar2 / 2 + iVar2;
  if (DAT_004437bc / 2 + *(int *)(iVar1 + 0x1c) < *(int *)(iVar1 + 0xc)) {
    *(undefined1 *)(iVar1 + 0x20) = 0;
  }
  return;
}
// ==== FUN_00418730 @ 00418730
void FUN_00418730(int param_1)
{
  undefined4 *puVar1;
  uint uVar2;
  byte *pbVar3;
  int iVar4;
  byte *pbVar5;
  puVar1 = *(undefined4 **)(param_1 + 0x10);
  FUN_00421910((void *)*puVar1,0,puVar1[2],puVar1[3],0x100,0);
  if ((void *)puVar1[1] != (void *)0x0) {
    FUN_00423fc0((void *)puVar1[1],puVar1[2] - 0x68,puVar1[3] + -0xb3,200,200,0x100,0);
  }
  *(undefined1 *)((int)DAT_004488d8 + 0xd) = 0;
  FUN_00424500(DAT_004488d8,0,0,0);
  pbVar5 = (byte *)puVar1[5];
  pbVar3 = (byte *)(puVar1[3] + 0x21);
  iVar4 = -1;
  uVar2 = FUN_00424560((int)DAT_004488d8,pbVar5);
  FUN_00424600((int)DAT_004488d8,puVar1[2] - (uVar2 >> 1),pbVar3,iVar4,pbVar5);
  FUN_00424600((int)DAT_004488d8,puVar1[2] + -100,(byte *)(puVar1[3] + 0x37),200,(byte *)puVar1[4]);
  return;
}
// ==== FUN_00418800 @ 00418800
undefined4 FUN_00418800(void)
{
  if (DAT_0044872c == 0) {
    return 1;
  }
  return CONCAT31((int3)((uint)*(int *)(DAT_0044872c + 0x10) >> 8),
                  *(char *)(*(int *)(DAT_0044872c + 0x10) + 0x20) == '\0');
}
// ==== FUN_00418820 @ 00418820
void FUN_00418820(void)
{
  if (DAT_0044872c != (LPVOID)0x0) {
    FUN_00420500(DAT_0044872c);
    DAT_0044872c = (LPVOID)0x0;
  }
  return;
}
// ==== FUN_00418840 @ 00418840
void FUN_00418840(int *param_1)
{
  int iVar1;
  int iVar2;
  int *piVar3;
  uint uVar4;
  int iVar5;
  undefined4 uVar6;
  int iStack_4;
  piVar3 = param_1;
  if (((int *)param_1[3] != (int *)0x0) && (iVar1 = *param_1, *(int *)(iVar1 + 0x2c) != 0)) {
    iVar2 = *(int *)param_1[3];
    iStack_4 = *(int *)(iVar2 + 0x14);
    param_1 = *(int **)(iVar2 + 0x18);
    iVar5 = *(int *)(iVar1 + 0x2c) / 2;
    FUN_004148f0(*(undefined4 *)(iVar2 + 0x10),&iStack_4,(int *)&param_1,0x28,0x14);
    FUN_004160d0(iStack_4,(int)param_1,iVar5);
    iVar1 = *piVar3;
    uVar6 = 2;
    *(int *)(iVar1 + 0x2c) = *(int *)(iVar1 + 0x2c) - iVar5;
    uVar4 = FUN_00436815();
    FUN_00416770(piVar3[6],*(undefined4 *)(&DAT_00442c40 + ((int)uVar4 % 3) * 4),uVar6);
  }
  return;
}
// ==== FUN_004188d0 @ 004188d0
void FUN_004188d0(void)
{
  int iVar1;
  int *piVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  piVar2 = *(int **)(DAT_004488bc + 4);
  iVar4 = 0;
  iVar5 = 0;
  iVar3 = 4;
  do {
    if (*(int *)(*piVar2 + 0x34) != -1) {
      iVar4 = iVar4 + *(int *)(*piVar2 + 0x28);
      iVar5 = iVar5 + 1;
    }
    piVar2 = piVar2 + 1;
    iVar3 = iVar3 + -1;
  } while (iVar3 != 0);
  iVar3 = 0;
  do {
    iVar1 = *(int *)(*(int *)(DAT_004488bc + 4) + iVar3);
    if (*(int *)(iVar1 + 0x34) != -1) {
      *(int *)(iVar1 + 0x28) = iVar4 / iVar5;
    }
    iVar3 = iVar3 + 4;
  } while (iVar3 < 0x10);
  *(int *)(DAT_0044809c + 0x1c) = *(int *)(DAT_0044809c + 0x1c) + (iVar4 - (iVar4 / iVar5) * iVar5);
  return;
}
// ==== FUN_00418940 @ 00418940
void FUN_00418940(int *param_1)
{
  uint uVar1;
  undefined4 uVar2;
  if (*(int *)(*param_1 + 0x34) < 9) {
    *(undefined4 *)(*param_1 + 0x34) = 6;
    uVar2 = 2;
    *(undefined4 *)(*param_1 + 0x30) = 3;
    uVar1 = FUN_00436815();
    FUN_00416770(param_1[6],*(undefined4 *)(&DAT_00442c40 + ((int)uVar1 % 3) * 4),uVar2);
  }
  return;
}
// ==== FUN_00418990 @ 00418990
void FUN_00418990(int *param_1)
{
  uint uVar1;
  undefined4 uVar2;
  if (*(int *)(*param_1 + 0x34) < 9) {
    *(undefined4 *)(*param_1 + 0x34) = 5;
    uVar2 = 2;
    *(undefined4 *)(*param_1 + 0x30) = 3;
    uVar1 = FUN_00436815();
    FUN_00416770(param_1[6],*(undefined4 *)(&DAT_00442c40 + ((int)uVar1 % 3) * 4),uVar2);
  }
  return;
}
// ==== FUN_004189e0 @ 004189e0
void FUN_004189e0(int *param_1)
{
  uint uVar1;
  undefined4 uVar2;
  if (*(int *)(*param_1 + 0x34) < 9) {
    *(undefined4 *)(*param_1 + 0x34) = 7;
    uVar2 = 2;
    *(undefined4 *)(*param_1 + 0x30) = 3;
    uVar1 = FUN_00436815();
    FUN_00416770(param_1[6],*(undefined4 *)(&DAT_00442c40 + ((int)uVar1 % 3) * 4),uVar2);
  }
  return;
}
// ==== FUN_00418a30 @ 00418a30
void FUN_00418a30(int param_1)
{
  int *piVar1;
  int iVar2;
  undefined4 uVar3;
  int iStack_4;
  iVar2 = param_1;
  piVar1 = *(int **)(param_1 + 0xc);
  if (piVar1 != (int *)0x0) {
    param_1 = *(int *)(*piVar1 + 0x14);
    iStack_4 = *(int *)(*piVar1 + 0x18);
    FUN_004148f0(*(undefined4 *)(*piVar1 + 0x10),&param_1,&iStack_4,0x28,0x14);
    *(int *)(*(int *)(iVar2 + 4) + 0x14) = param_1;
    *(int *)(*(int *)(iVar2 + 4) + 0x18) = iStack_4;
    uVar3 = FUN_00415290(*(int *)(iVar2 + 4));
    *(undefined4 *)(*(int *)(iVar2 + 4) + 0x10) = uVar3;
  }
  return;
}
// ==== FUN_00418aa0 @ 00418aa0
void FUN_00418aa0(int param_1)
{
  undefined4 uVar1;
  undefined4 uStack_8;
  undefined4 uStack_4;
  FUN_00414af0(&DAT_00442d84,&uStack_8,&uStack_4);
  *(undefined4 *)(*(int *)(param_1 + 4) + 0x14) = uStack_8;
  *(undefined4 *)(*(int *)(param_1 + 4) + 0x18) = uStack_4;
  uVar1 = FUN_00415290(*(int *)(param_1 + 4));
  *(undefined4 *)(*(int *)(param_1 + 4) + 0x10) = uVar1;
  return;
}
// ==== FUN_00418af0 @ 00418af0
void FUN_00418af0(int *param_1)
{
  if (*(int *)(*param_1 + 0x34) < 9) {
    *(undefined4 *)(*param_1 + 0x34) = 3;
    *(undefined4 *)(*param_1 + 0x30) = 3;
  }
  return;
}
// ==== FUN_00418b10 @ 00418b10
void FUN_00418b10(int *param_1)
{
  if (*(int *)(*param_1 + 0x34) < 9) {
    *(undefined4 *)(*param_1 + 0x34) = 4;
    *(undefined4 *)(*param_1 + 0x30) = 3;
  }
  return;
}
// ==== FUN_00418b30 @ 00418b30
void FUN_00418b30(int *param_1)
{
  if (*(int *)(*param_1 + 0x34) < 9) {
    *(undefined4 *)(*param_1 + 0x34) = 8;
    *(undefined4 *)(*param_1 + 0x30) = 3;
  }
  return;
}
// ==== FUN_00418b60 @ 00418b60
void FUN_00418b60(int *param_1)
{
  int iVar1;
  iVar1 = *(int *)(*param_1 + 0x34);
  if ((iVar1 == 6) || (iVar1 == 7)) {
    *(undefined4 *)(*param_1 + 0x34) = 0;
    *(undefined4 *)(*param_1 + 0x30) = 0;
  }
  return;
}
