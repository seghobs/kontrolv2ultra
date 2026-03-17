import logging

import flask.cli

from app_core import create_app

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

app = create_app()


if __name__ == "__main__":
    host = "127.0.0.1"
    port = 5000

    flask.cli.show_server_banner = lambda *args, **kwargs: None
    logging.getLogger("werkzeug").setLevel(logging.ERROR)

    print(f"Sunucu adresi: http://{host}:{port}")
    app.run(host=host, port=port, debug=False, use_reloader=False)
