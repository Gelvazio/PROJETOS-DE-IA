# Project NOMAD (instalação local, sem IA)

Servidor offline de conhecimento (https://www.projectnomad.us/ · código em `project-nomad/`, que não é
versionado aqui). Instalado via **Docker Desktop** com o compose adaptado em `docker/compose.yaml`.

- Endereço: http://localhost:8080 (acessível só neste computador).
- Containers: `nomad_admin`, `nomad_mysql`, `nomad_redis`. **Sem IA local** (Ollama/Qdrant não instalados).
- Dados em volumes do Docker: `project-nomad_nomad-storage`, `_nomad-mysql`, `_nomad-redis`.
- Segredos em `docker/.env` (não versionado; gerado na instalação).

## Comandos (na pasta `docker/`)

```bash
docker compose --env-file .env up -d     # iniciar
docker compose --env-file .env stop      # parar
docker compose --env-file .env down      # remover containers (os dados ficam nos volumes)
docker compose --env-file .env logs -f admin
```

## Diferenças em relação ao oficial

O oficial (`project-nomad/install/management_compose.yaml`) é para Debian/Ubuntu. Aqui ficaram de fora o
`dozzle`, o `updater` e o `disk-collector` (pedem o disco inteiro e o socket do Docker) e a porta abre só em
`127.0.0.1`. O `admin` mantém o socket do Docker porque é ele que cria os apps (Kiwix etc.) como containers.
Como é um caminho não oficial no Windows, apps que dependam de caminhos Linux podem falhar.
