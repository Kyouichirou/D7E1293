````
encode = "utf-8"
LCase(md5(Mid$(strx, InStr(1, filename, "_", vbBinaryCompare) + 1, InStrRev(filename, ".", , vbBinaryCompare) - InStr(1, filename, "_", vbBinaryCompare) - 1)))
````
