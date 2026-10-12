from django.contrib import admin
from django.urls import include, path

from emailer.views import index

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", index),
    path("api/email/", include("emailer.urls")),
]