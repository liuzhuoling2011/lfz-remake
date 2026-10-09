import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.app.cmd.disassemble.DisassembleCommand;
import ghidra.app.cmd.function.CreateFunctionCmd;
import ghidra.program.model.listing.*;
import ghidra.program.model.address.*;
import ghidra.program.model.mem.*;
import java.io.*;
import java.util.*;
public class Recover extends GhidraScript {
  public void run() throws Exception {
    Memory mem = currentProgram.getMemory();
    Listing lst = currentProgram.getListing();
    FunctionManager fm = currentProgram.getFunctionManager();
    Address start = toAddr(0x401000), end = toAddr(0x43eb9b);
    int created=0;
    for (int pass=0; pass<4; pass++) {
      int c=0;
      for (long a=0x401000; a<0x43eb9b; a+=16) {
        Address ad = toAddr(a);
        if (fm.getFunctionContaining(ad)!=null) continue;
        byte b0=mem.getByte(ad);
        // previous byte must be padding or ret
        byte pb=mem.getByte(ad.subtract(1));
        if (!(pb==(byte)0xCC || pb==(byte)0x90 || pb==(byte)0xC3)) continue;
        if (b0==(byte)0xCC || b0==(byte)0x90 || b0==0) continue;
        DisassembleCommand dc = new DisassembleCommand(ad, null, true);
        dc.applyTo(currentProgram, monitor);
        if (lst.getInstructionAt(ad)==null) continue;
        CreateFunctionCmd cf = new CreateFunctionCmd(ad);
        if (cf.applyTo(currentProgram, monitor)) c++;
      }
      created+=c; println("pass "+pass+" created "+c);
      if (c==0) break;
    }
    println("total created "+created);
    DecompInterface d = new DecompInterface();
    d.openProgram(currentProgram);
    PrintWriter pw = new PrintWriter(new FileWriter("/workspace/mg_re/decomp_all2.c"));
    for (Function f : fm.getFunctions(true)) {
      DecompileResults r = d.decompileFunction(f, 60, monitor);
      pw.println("// ==== " + f.getName() + " @ " + f.getEntryPoint());
      if (r != null && r.decompileCompleted()) pw.println(r.getDecompiledFunction().getC());
      else pw.println("// FAILED");
    }
    pw.close();
  }
}
