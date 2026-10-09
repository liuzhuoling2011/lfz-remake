// ==== FUN_00426980 @ 00426980
void __cdecl FUN_00426980(size_t param_1,int *param_2,int param_3)
{
  if (param_3 == 0) {
    param_2 = FUN_0042b630(param_1,(undefined8 *)param_2);
  }
  else if (param_3 == 1) {
    param_2 = FUN_0042b360(param_1,(undefined8 *)param_2);
  }
  else if (param_3 == 2) {
    param_2 = FUN_00420cc0((undefined8 *)param_2);
  }
  if (param_2 != (int *)0x0) {
    param_2[7] = param_3;
  }
  return;
}
// ==== FUN_004269e0 @ 004269e0
void FUN_004269e0(int param_1)
{
  int iVar1;
  if (param_1 != 0) {
    iVar1 = *(int *)(param_1 + 0x1c);
    if (iVar1 == 0) {
      FUN_0042b6d0(param_1);
    }
    else {
      if (iVar1 == 1) {
        FUN_0042b490(param_1);
        return;
      }
      if (iVar1 == 2) {
        FUN_00420d70(param_1);
        return;
      }
    }
  }
  return;
}
// ==== FUN_00426a20 @ 00426a20
void __thiscall FUN_00426a20(int param_1,undefined8 *param_2)
{
  int iVar1;
  if (param_2 != (undefined8 *)0x0) {
    FUN_00426d40((undefined8 *)(*(int *)(param_1 + 0x10) + *(int *)(param_1 + 0x14) * 8),param_2,8);
    iVar1 = *(int *)(param_1 + 0x14) + 1;
    *(int *)(param_1 + 0x14) = iVar1;
    if (0xff < iVar1) {
      *(undefined4 *)(param_1 + 0x14) = 0;
    }
    if ((*(int *)(param_1 + 0x14) == *(int *)(param_1 + 0x18)) &&
       (iVar1 = *(int *)(param_1 + 0x18) + 1, *(int *)(param_1 + 0x18) = iVar1, 0xff < iVar1)) {
      *(undefined4 *)(param_1 + 0x18) = 0;
    }
  }
  return;
}
// ==== FUN_0042b570 @ 0042b570
void FUN_0042b570(void)
{
  int *piVar1;
  DWORD DVar2;
  int iVar3;
  int iVar4;
  undefined1 uStack_8;
  undefined1 uStack_7;
  DWORD DStack_4;
  if (DAT_00469900 != '\0') {
    GetKeyboardState((PBYTE)0x469800);
    iVar4 = 0;
    if (0 < *DAT_00469904) {
      do {
        piVar1 = *(int **)(DAT_00469904[1] + iVar4 * 4);
        DVar2 = GetTickCount();
        iVar3 = 0;
        if (0 < piVar1[1]) {
          do {
            if ((*(byte *)(*(byte *)(piVar1[2] + iVar3) + 0x469800) & 0x80) == 0) {
              *(undefined1 *)(*piVar1 + iVar3) = 0;
              if (*(char *)(piVar1[3] + iVar3) == '\x01') {
                *(undefined1 *)(piVar1[3] + iVar3) = 0;
                uStack_7 = 1;
                goto LAB_0042b5fe;
              }
            }
            else {
              *(undefined1 *)(*piVar1 + iVar3) = 1;
              if (*(char *)(piVar1[3] + iVar3) == '\0') {
                *(undefined1 *)(piVar1[3] + iVar3) = 1;
                uStack_7 = 0;
LAB_0042b5fe:
                uStack_8 = (undefined1)iVar3;
                DStack_4 = DVar2;
                FUN_00426a20(&uStack_8);
              }
            }
            iVar3 = iVar3 + 1;
          } while (iVar3 < piVar1[1]);
        }
        iVar4 = iVar4 + 1;
      } while (iVar4 < *DAT_00469904);
    }
  }
  return;
}
// ==== FUN_0042b630 @ 0042b630
int * __cdecl FUN_0042b630(size_t param_1,undefined8 *param_2)
{
  int *piVar1;
  undefined8 *puVar2;
  void *pvVar3;
  int iVar4;
  int iVar5;
  if (DAT_00469900 == '\0') {
    return (int *)0x0;
  }
  piVar1 = _malloc(0x20);
  piVar1[1] = param_1;
  puVar2 = _malloc(param_1);
  piVar1[2] = (int)puVar2;
  FUN_00426d40(puVar2,param_2,piVar1[1]);
  pvVar3 = _malloc(piVar1[1]);
  *piVar1 = (int)pvVar3;
  pvVar3 = _malloc(piVar1[1]);
  piVar1[3] = (int)pvVar3;
  pvVar3 = _malloc(0x800);
  piVar1[4] = (int)pvVar3;
  piVar1[5] = 0;
  piVar1[6] = 0;
  iVar4 = 0;
  if (0 < piVar1[1]) {
    do {
      iVar5 = iVar4 + 1;
      *(undefined1 *)(*piVar1 + -1 + iVar5) = 0;
      *(undefined1 *)(iVar4 + piVar1[3]) = 0;
      iVar4 = iVar5;
    } while (iVar5 < piVar1[1]);
  }
  FUN_00423140(DAT_00469904,piVar1);
  return piVar1;
}
