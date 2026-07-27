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
docker build -t europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.6 .
docker push europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.6


#kubectl set image deployment/thaniumos-api thaniumos-api=europe-west1-docker.pkg.dev/dev-thaniumos/dev-thaniumos-repo/thaniumos-api:v1.0.1


# DEPLOY BASE64 ENCODED SECRETS
# ENCODE BASE64
printf %s 'postgres://postgres:R0ck3tSh!p0s@10.9.160.3:5432/thaniumnine' | base64 -w0

# DECODE BASE64
printf %s "MTExMTIz" | base64 -d


kubectl describe ingress thaniumos-ingress
kubectl describe svc thaniumos-api-service
kubectl get endpoints thaniumos-api-service
kubectl describe backendconfig thaniumos-api-backend-config

kubectl get secret env-secret
kubectl get networkpolicy
kubectl get frontendconfig
kubectl get backendconfig
kubectl get svc
kubectl get ingress
kubectl get deployment


echo "NODE_ENV=$NODE_ENV"
echo "PORT=$PORT"
echo "ACCESS_TOKEN_TTL_SECONDS=$ACCESS_TOKEN_TTL_SECONDS"
echo "REFRESH_TOKEN_TTL_DAYS=$REFRESH_TOKEN_TTL_DAYS"
echo "AUTH_ALLOW_REGISTRATION=$AUTH_ALLOW_REGISTRATION"
echo "CORS_ORIGIN=$CORS_ORIGIN"
echo "JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET"
echo "DATABASE_URL=$DATABASE_URL"