````
encode = "utf-8"
LCase(md5(Mid$(strx, InStr(1, strx, "_", vbBinaryCompare) + 1, InStrRev(strx, ".", , vbBinaryCompare) - InStr(1, strx, "_", vbBinaryCompare) - 1)))
````
