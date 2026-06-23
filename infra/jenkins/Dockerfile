FROM jenkins/jenkins:lts-jdk17

USER root

# Dependencias base
RUN apt-get update && \
    apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    unzip && \
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

# Instalar k6
RUN curl -fsSL -o /tmp/k6.tar.gz https://github.com/grafana/k6/releases/download/v0.51.0/k6-v0.51.0-linux-amd64.tar.gz && \
    tar -xzf /tmp/k6.tar.gz -C /tmp && \
    mv /tmp/k6-v0.51.0-linux-amd64/k6 /usr/local/bin/k6 && \
    rm -rf /tmp/k6.tar.gz /tmp/k6-v0.51.0-linux-amd64

# Instalar OWASP ZAP
RUN curl -fsSL -o /tmp/zap.tar.gz https://github.com/zaproxy/zap-archive/releases/download/zap-v2.15.0/ZAP_2.15.0_Linux.tar.gz && \
    tar -xzf /tmp/zap.tar.gz -C /opt && \
    mv /opt/ZAP_2.15.0 /opt/zap && \
    ln -s /opt/zap/zap.sh /usr/local/bin/zap && \
    chown -R jenkins:jenkins /opt/zap && \
    rm /tmp/zap.tar.gz

USER jenkins

# Plugins Jenkins
RUN jenkins-plugin-cli --plugins \
    blueocean \
    docker-workflow \
    sonar \
    github-branch-source \
    configuration-as-code