FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY austinbeertracker2026roadto1500.html /usr/share/nginx/html/austinbeertracker2026roadto1500.html
COPY beer_stats.json /usr/share/nginx/html/beer_stats.json
COPY assets /usr/share/nginx/html/assets
COPY draft /usr/share/nginx/html/draft

EXPOSE 80
