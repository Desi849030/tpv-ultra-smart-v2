
import os, sys

with open('/storage/emulated/0/Download/debug.txt', 'w') as f:
    f.write('iniciado\n')
    f.write('cwd: ' + os.getcwd() + '\n')
    f.write('__file__: ' + str(globals().get('__file__', 'N/A')) + '\n')
    f.write('sys.path: ' + str(sys.path[:5]) + '\n')
