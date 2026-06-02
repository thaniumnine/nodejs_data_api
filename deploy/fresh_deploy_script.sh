docker build -t europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.0 .

gcloud auth configure-docker europe-west1-docker.pkg.dev

docker push europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.0 .

kubectl create deployment thaniumos-api --image=europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.0

kubectl scale deployment thaniumos-api --replicas=0

kubectl expose deployment thaniumos-api --name=thaniumos-api-service --type=LoadBalancer --port 80 --target-port 3500







kubectl apply -f env-secret.yaml    
kubectl apply -f egress.yaml
kubectl apply -f front-end.yaml
kubectl apply -f back-end.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
kubectl apply -f deployment.yaml

# tail -f /dev/null

## update existing deployment
docker build -t europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.1 .
docker push europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.1


#kubectl set image deployment/thaniumos-api thaniumos-api=europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.1


# DEPLOY BASE64 ENCODED SECRETS
# ENCODE BASE64
printf %s "9BDIAb0z45sSbg7Yj/oHr6wPERrowEKWifYjEpY0pq0=" | base64 -w0

# DECODE BASE64
printf %s "MTExMTIz" | base64 -d