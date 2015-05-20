import bpy
from bpy.props import (BoolProperty,
                       EnumProperty,
                       FloatProperty,
                       IntProperty,
                       StringProperty,
                       PointerProperty)
from bpy.types import  PropertyGroup      

class HelloWorldPanel(bpy.types.Panel, PropertyGroup):
    """Creates a Panel in the Object properties window"""
    bl_label = "Hello World Panel"
    bl_idname = "OBJECT_PT_hello"
    bl_space_type = 'PROPERTIES'
    bl_region_type = 'WINDOW'
    bl_context = "object"

    def draw(self, context):
        layout = self.layout

        obj = context.object

        row = layout.row()
        row.label(text="Hello world!", icon='WORLD_DATA')

        row = layout.row()
        row.label(text="Active object is: " + obj.name)
        row = layout.row()
        row.prop(obj, "name")

        #row = layout.row()
        #row.operator("mesh.primitive_cube_add")
        
        print(self)
                
        row = layout.row(align=True)
        row.prop(obj.oni_props, 'gdf')
        row.operator("object.group_add", text="", icon='ZOOMIN')
        
###########
class OniProperties(PropertyGroup):
	@classmethod
	def register(cls):
		cls.gdf = StringProperty(
			name="GDFolder",
			description="Path to ONI GameDataFolder",
			maxlen = 1024,
			default = "qwerty")

		bpy.types.Object.oni_props = PointerProperty(type=cls, name="Oni", description="Oni Settings")

	@classmethod
	def unregister(cls):
		del bpy.types.Object.oni_props
#######################


def register():
    bpy.utils.register_class(OniProperties)
    bpy.utils.register_class(HelloWorldPanel)


def unregister():
    bpy.utils.unregister_class(HelloWorldPanel)
    bpy.utils.unregister_class(OniProperties)


if __name__ == "__main__":
    register()
