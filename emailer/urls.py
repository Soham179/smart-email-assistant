from django.urls import path
from .views import GenerateReplyView

urlpatterns = [
    path("generate/", GenerateReplyView.as_view(), name="generate-reply"),
]