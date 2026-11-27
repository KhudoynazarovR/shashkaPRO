# Tundra protocol investigation

Static inspection of the supplied Tundra.exe with objdump and strings confirms:
- 0x404704 initializes the mode at 0x436B7C.
- 0x404817 copies a byte into the buffer at 0x436B88; 0x404824 terminates it.
- 0x404976 and 0x4049B9 set modes 3 and 4 respectively.
- 0x404B03 reads the mode; 0x404B2C places the buffer address on the stack.
- Embedded strings include /suggestmove, /suggestmoveposition, /analyzeposition and /position.
- Clipboard API names are present, but this does not establish a move-output protocol.

Reproduce with `objdump -d -Mintel Tundra.exe` and `strings -a Tundra.exe`.

Unresolved: native position encoding, move output, runtime validation. Do not enable public bot or substitute another engine. Wine and a Windows cross-compiler were not available in the inspection environment.
