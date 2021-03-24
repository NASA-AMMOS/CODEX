FROM phusion/baseimage:bionic-1.0.0

# Install NGINX 

RUN apt-get update
RUN apt-get install -y nginx

# Set NGINX service
RUN mkdir -p /etc/service/nginx
COPY nginx.runit /etc/service/nginx/run

# Copy NGINX config
RUN mkdir -p /home/webserver
COPY proxy.conf /home/webserver

EXPOSE 3000