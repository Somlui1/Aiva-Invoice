# Python 3.14 official image + Node 24 + Pi agent, everything runs as root
FROM python:3.14-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_BREAK_SYSTEM_PACKAGES=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl gnupg git ripgrep jq unzip zip sudo build-essential \
      procps iproute2 iputils-ping wget xvfb \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# uv / pipx for Python tooling that Pi may want to install later
RUN pip install --no-cache-dir uv pipx

# Pi coding agent
RUN npm install -g --ignore-scripts @earendil-works/pi-coding-agent

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY run-until-done.sh /usr/local/bin/run-until-done.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/run-until-done.sh

WORKDIR /workspace
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/local/bin/run-until-done.sh"]
