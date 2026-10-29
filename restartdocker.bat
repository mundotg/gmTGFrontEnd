# 1. Para o container atual
docker stop MustaInfoo-front
docker rm MustaInfoo-front

# 2. Reconstrói a imagem (o Docker vai usar cache para ser mais rápido)
docker build -t MustaInfoo-vercel-clone .

# 3. Roda novamente
docker run -d -p 3000:3000 --name MustaInfoo-front MustaInfoo-vercel-clone