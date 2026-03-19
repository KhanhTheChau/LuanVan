from flask import Flask
from flask_cors import CORS
from celery import Celery
import os

def create_app():
    # Make /public available to serve images for prediction history
    app = Flask(__name__, static_folder="public", static_url_path="/public")
    CORS(app)

    # Config Limits for Batch predictions (e.g., 500 MB)
    app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024

    # Celery & Redis Configurations
    app.config["CELERY_BROKER_URL"] = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
    app.config["CELERY_RESULT_BACKEND"] = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    # Register Blueprints (Routes)
    from routes.predict import predict_bp
    from routes.dataset import dataset_bp
    from routes.unlearn import unlearn_bp
    from routes.auth import auth_bp
    from routes.feedback import feedback_bp

    app.register_blueprint(predict_bp, url_prefix="/api")
    app.register_blueprint(dataset_bp, url_prefix="/api")
    app.register_blueprint(unlearn_bp, url_prefix="/api/unlearn")
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(feedback_bp, url_prefix="/api")

    return app

def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=app.config['CELERY_RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL']
    )
    celery.conf.update(app.config)

    # Ensure task execution requires application context
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery.Task = ContextTask
    return celery

app = create_app()
celery_app = make_celery(app)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
