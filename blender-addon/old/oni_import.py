import bpy, os
from io_scene_oni.oni_files import ONI_FILES 
from io_scene_oni.oni_types import (
        Oni,
        OniInstanceFile,
        OniInstanceDesc
    )

def printDescs(log, oni, tag, name):
    log.write('================================================================================\n')
    log.write('>> printDescsByName("'+tag+'", "'+name+'"):\n')
    for f in oni.files:
        descs = f.find(tag, name)
        descs = sorted(descs, key= lambda d: d.name)
        log.write(f.fname + ':\n')
        for d in descs:
            log.write(d.name + '\n')
            #d.getData().draw()

"""
for f in oni.files:
    print(f.level)
print(oni.lfiles)
"""

def printTagsCount(log, oni, level):
    log.write('================================================================================\n')
    log.write('>> printTagsCount('+str(level)+'):\n')
    tags = {}
    inst_descs = oni.lfiles[level].inst_descs
    for d in inst_descs:
        tag = d.tag
        if tag in tags:
            tags[tag] += 1
        else:
            tags[tag] = 1
    tags = sorted(tags.items(), key=lambda tag: tag[1])        
    for tag in tags:
        log.write(str(tag) + ' - ' + ONI_FILES[tag[0]]['description'] + '\n')

def drawM3GMs(log, oni, level, name):
    log.write('================================================================================\n')
    log.write('>> drawM3GMs('+str(level)+', "'+name+'"):\n')
    lf = oni.lfiles[level]
    descs = lf.find('M3GM', name)
    for d in descs:
        log.write(d.name+'\n')
        d.getData().draw()
        bpy.context.scene.cursor_location.y += 5
        
def drawONCC(log, oni, level, name): 
    lf = oni.lfiles[level]   
    oncc = lf.find('ONCC', name)[0]
    oncc.getData()
    #oncc.print()
    
    oncc.data.importModel()
    oncc.data.importAnimations()
    


'''    
names = {}
for d in inst['inst_descs']:
    name = d.name
    if name in names:
        names[name] += 1
    else:
        names[name] = 1
names = sorted(names.items())        
for name in names:
    print(name)
'''

"""
print('M3GA')
for d in inst['inst_descs']:
    if d.tag == 'M3GA' and d.isNamed():
        print(d.name)
"""

"""
    lf = oni.lfiles[0]
    descs = lf.find('ONCC')
    for d in descs:
        log.write(d.name+'\n')
"""
    
print('================================================================================')

#gdf = 'D:\workspace4\ONI\GameDataFolder'
gdf = 'C:\Program Files (x86)\Oni\AE\GameDataFolder'
oni = Oni(gdf);
with open('D:/oni_log.txt', 'a') as log:
    #printTagsCount(log, oni, 2)
    #printDescs(log, oni, 'M3GM', 'ai')
    #drawM3GMs(log, oni, 14, 'chair')
    drawONCC(log, oni, 0, 'konoko')