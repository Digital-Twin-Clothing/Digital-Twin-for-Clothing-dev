import json
import torch
import smplx
import trimesh

#Function to load beta values from a JSON file. 
def load_betas(fname):
    with open(fname, "r") as file:
        loaded_data = json.load(file)
        print(f"Beta list {fname}: ", loaded_data["Beta_list"])

        saved_betas = loaded_data["Beta_list"]
        print(f"Data type of saved_betas {fname}: ", type(saved_betas))

    return saved_betas

#function to measure the height of the mesh based on the y-coordinates of the vertices
def measure_height(vertices):
    y_values = vertices[0][:, 1]
    y_max = y_values.max()
    y_min = y_values.min()
    height = (y_max - y_min).item()
    return height

#Function to scale the vertices to a target height. 
def scale_to_height(vertices, target_height):
    current_height = measure_height(vertices)
    scale_factor = target_height / current_height

    return vertices * scale_factor, scale_factor


front_betas = load_betas("front_body_data.json")
left_betas = load_betas("left_body_data.json")
right_betas = load_betas("right_body_data.json")
back_betas = load_betas("back_body_data.json")

fused_betas = []

# Now the averaging loop, the main part. Add it after all four blocks, not indented, so it runs once all the lists exist. In plain English:
for i in range(len(front_betas)):
    beta_avg = (front_betas[i] + back_betas[i] + left_betas[i] + right_betas[i])/4
    fused_betas.append(beta_avg)

print(len(fused_betas))
print(fused_betas[0])
fused_betas = torch.tensor(fused_betas)
fused_betas = fused_betas.reshape(1, fused_betas.shape[0])
print("Reshaped saved_betas shape:", fused_betas.shape)

model_folder = "C:/Users/Niyam/Documents/CameraHMR/data/models/smplx_neutral_head/models_lockedhead"
model = smplx.create(model_folder, model_type="smplx", gender="neutral", num_betas=16, ext="npz")

model_output = model(betas=fused_betas)
vertices = model_output.vertices
print('Vertices shape =', vertices.shape)
print(type(vertices))

body_height = measure_height(vertices)
print("Mesh height (m):", body_height)

#Because I am returning two values, the call has to unpack both:
scaled_vertices, scale_factor = scale_to_height(vertices, 1.753)
print(type(scaled_vertices), scaled_vertices.shape)
print("Scaled height (m):", measure_height(scaled_vertices))
print("Scale factor:", scale_factor)

faces = model.faces 
print('Faces shape =', faces.shape) 
print(type(faces))

with open("fused_body_tester.obj", "w") as file:
    for vertex in scaled_vertices[0]:
        file.write(f"v {vertex[0].item()} {vertex[1].item()} {vertex[2].item()}\n")
    for f in faces:
        file.write(f"f {f[0] + 1} {f[1] + 1} {f[2] + 1}\n")

mesh = trimesh.Trimesh(scaled_vertices[0].detach().cpu().numpy(), faces, process=False)
mesh.export("fused_betas_body.glb")




