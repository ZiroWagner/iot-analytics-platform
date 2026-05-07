FROM jenkins/jenkins:lts-jdk17

USER root

# Dependencias base
RUN apt-get update && \
    apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release && \
    rm -rf /var/lib/apt/lists/*

# Instalar Docker CLI
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli

# Instalar Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Instalar herramientas globales
RUN npm install -g pnpm yarn

# Permisos Docker
RUN groupadd -f docker && usermod -aG docker jenkins

USER jenkins

# Plugins Jenkins
RUN jenkins-plugin-cli --plugins \
    blueocean \
    docker-workflow \
    sonar \
    github-branch-source \
    configuration-as-code