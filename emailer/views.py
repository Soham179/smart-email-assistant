from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import EmailRequestSerializer
from .services import generate_email_reply


def index(request):
    return render(request, "emailer/index.html")


class GenerateReplyView(APIView):
    def post(self, request):
        serializer = EmailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            reply = generate_email_reply(
                d["email_content"],
                d["tone"],
                d["greeting"],
                d["notes"],
                d["sender_name"],
            )
        except Exception as e:
            print("Gemini error:", e)  # full error stays in your terminal
            return Response(
                {"error": "The AI service is busy right now. Please try again in a minute."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({"reply": reply})