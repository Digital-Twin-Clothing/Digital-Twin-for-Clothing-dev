import json
import torch
import smplx
import trimesh

#loading the body json data as a file
with open("_body_data.json", "r") as file:
    loaded_body_data = json.load(file)
    print("Beta list:", loaded_body_data["Beta_list"])

    saved_betas = loaded_body_data["Beta_list"]
    print("Data type of saved_betas: ", type(saved_betas))
    
    saved_betas = torch.tensor(saved_betas)
    print("Tensor type:", type(saved_betas),"\n" + "Tensor shape:", saved_betas.shape)
    saved_betas = saved_betas.reshape(1, saved_betas.shape[0])
    print("Reshaped saved_betas shape:", saved_betas.shape)

model_folder = "C:/Users/Niyam/Documents/CameraHMR/data/models/smplx_neutral_head/models_lockedhead" #Specifying the model path
model = smplx.create( model_folder, model_type="smplx", gender="neutral", num_betas=16, ext="npz") #This will create the model and load the weights from the specified model folder.

# #Run the SMPL-X model using these beta values, then store the computed result in model_output.
model_output = model(betas=saved_betas) #Creating the model output by calling the model with the beta tensor in it.
vertices = model_output.vertices  #This will extract the vertices from the model output.
# #model.vertices = where the points ended up for THIS body
print('Vertices shape =', vertices.shape) #Printing the shape of the vertices tensor to verify its dimensions.
#We get a return of 1 = one person, 10475 = number of vertices, 3 = each vertex has x, y, z
print(type(vertices)) #just checking the type

#We now need to extract the faces from the model_output. The faces are a numpy array it defines which points should be connected into triangles. 
#This is important for rendering the 3D model correctly.
faces = model.faces #This will extract the faces from the model output. This is a numpy array not a tensor.
#model.faces = which points should always be connected into triangles
print('Faces shape =', faces.shape) #Printing the shape of the faces tensor to verify its dimensions.
print(type(faces)) #seeing the type of the faces.

#Open 'base_body.obj' for writing ('w')
with open("base_body_tester.obj", "w") as file:
    for vertex in vertices[0]: #Iterating through each vertex in the vertices tensor.
        file.write(f"v {vertex[0].item()} {vertex[1].item()} {vertex[2].item()}\n") #Writing the vertex coordinates to the .obj file in the required format.
        #The f makes it an f-string, which lets Python evaluate values inside {} and insert them into the text.
    for f in faces: #Why? Your faces shape is: (20908, 3) So faces already means: 20,908 faces each face has 3 vertex indices using face[0] would give you the first face, which is a list of 3 vertex indices.
        file.write(f"f {f[0] + 1} {f[1] + 1} {f[2] + 1}\n") 
        #We add 1 to each vertex index inside each face because Python indexes from 0, while OBJ indexes from 1.


mesh = trimesh.Trimesh(vertices[0].detach().cpu().numpy(), faces, process=False)
mesh.export("saved_betas_body.glb") #Exporting the mesh to a .glb file using trimesh. The vertices are converted to a numpy array and the faces are used as is. The process=False argument prevents trimesh from modifying the mesh during export.