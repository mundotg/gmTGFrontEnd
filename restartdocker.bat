# 1. Para o container atual
docker stop mustainfo-front
docker rm mustainfo-front

# 2. Reconstrói a imagem (o Docker vai usar cache para ser mais rápido)
docker build -t mustainfo-vercel-clone .

# 3. Roda novamente
docker run -d -p 3000:3000 --name mustainfo-front mustainfo-vercel-clone