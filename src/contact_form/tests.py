from django.core import mail
from django.test import TestCase
from django.urls import reverse

from .forms import ContactForm
from .models import Contact


class ContactFormValidationTests(TestCase):
    def test_name_rejects_digits(self):
        form = ContactForm(
            data={
                "name": "Jean2",
                "email": "jean@example.com",
                "message": "Un message suffisamment long.",
            }
        )
        self.assertFalse(form.is_valid())
        self.assertIn("name", form.errors)

    def test_message_must_be_at_least_10_characters(self):
        form = ContactForm(
            data={
                "name": "Jean",
                "email": "jean@example.com",
                "message": "court",
            }
        )
        self.assertFalse(form.is_valid())
        self.assertIn("message", form.errors)

    def test_valid_form(self):
        form = ContactForm(
            data={
                "name": "Jean",
                "email": "jean@example.com",
                "subject": "Question",
                "message": "Un message suffisamment long.",
            }
        )
        self.assertTrue(form.is_valid())


class ContactViewTests(TestCase):
    def test_contact_page_ok(self):
        response = self.client.get(reverse("contact_form:contact"))
        self.assertEqual(response.status_code, 200)

    def test_valid_submit_saves_and_sends_mail(self):
        response = self.client.post(
            reverse("contact_form:contact"),
            {
                "name": "Jean",
                "email": "jean@example.com",
                "subject": "Question",
                "message": "Un message suffisamment long.",
            },
        )
        self.assertRedirects(response, reverse("contact_form:success"))
        self.assertEqual(Contact.objects.count(), 1)
        contact = Contact.objects.get()
        self.assertEqual(contact.name, "Jean")
        self.assertEqual(contact.email, "jean@example.com")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("[Contact] Question", mail.outbox[0].subject)

    def test_invalid_submit_does_not_save(self):
        response = self.client.post(
            reverse("contact_form:contact"),
            {
                "name": "Jean2",
                "email": "jean@example.com",
                "message": "court",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Contact.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_default_subject_when_empty(self):
        self.client.post(
            reverse("contact_form:contact"),
            {
                "name": "Jean",
                "email": "jean@example.com",
                "subject": "",
                "message": "Un message suffisamment long.",
            },
        )
        contact = Contact.objects.get()
        self.assertEqual(contact.subject, "Nouveau message de contact")

    def test_success_page_ok(self):
        response = self.client.get(reverse("contact_form:success"))
        self.assertEqual(response.status_code, 200)
