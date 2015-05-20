import bge, bpy

class Game:
    instance = None
    
    def getInstance():
        if Game.instance is None:
            Game.instance = Game()
        return Game.instance
    
    def __init__(self):
        self.started = False    
        self.n = 0
        self.players = []
    
    def start(self):
        print('Starting')
        self.started = True
        #self.addPlayer()

    def stop(self):
        print('Stopping')

        try:
            for p in self.players:
                p.delete()
        finally:
            self.started = False
            bge.logic.endGame()


    def addPlayer(self):
        player = Player('pelvis')
        self.players.append(player)
    
    def loop(self):
        #print('Gameloop ' + str(self.n))
        self.n += 1

        keyboard = bge.logic.keyboard
        key_events = keyboard.events
        is_shifted = key_events[bge.events.LEFTSHIFTKEY] == bge.logic.KX_INPUT_ACTIVE or \
                            key_events[bge.events.RIGHTSHIFTKEY] == bge.logic.KX_INPUT_ACTIVE
        if key_events[bge.events.ESCKEY] == bge.logic.KX_INPUT_JUST_ACTIVATED:
            self.stop()

        #if key_events[bge.events.AKEY] == bge.logic.KX_INPUT_JUST_ACTIVATED:
        #    self.addPlayer()

        if key_events[bge.events.SPACEKEY] == bge.logic.KX_INPUT_JUST_ACTIVATED:
            for p in self.players:
                p.animate('TRAMKONCOMrun_throw_fw')


class Player:
    def __init__(self, name):
        self.name = name
        scene = bge.logic.getCurrentScene()
        self.obj = scene.addObject(name, 'GameClock')
        print(self.obj.localPosition)
        print(self.obj.localOrientation.to_quaternion())
        print(self.obj.localOrientation.to_euler())
        

    def delete(self):
        pass

    def animate(self, anim, obj=None):
        if obj is None:
            obj = self.obj
            #print(obj.rotation_quaternion)
        #objs = ['pelvis']#'thigh.R', 
        #if obj.name in objs:
        action = bpy.data.actions[anim+'_'+obj.name]
        frange = action.frame_range
        obj.playAction(action.name, frange[0],frange[1])
        print(action.name + ' - '+ str(frange))

        for child in obj.children:
            self.animate(anim, child)
        
        
def main(cont):   
    game = Game.getInstance()         
    if not game.started:
        game.start()
    else:
        game.loop()  
          