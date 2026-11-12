import time

from django.core import mail
from django.test import TestCase
from django.urls import reverse

from .forms import ContactForm, sign_rendered_at
from .models import Contact


def contact_payload(**overrides):
    """Envoi humain : honeypot vide, formulaire affiché depuis 30 secondes."""
    data = {
        "name": "Jean",
        "email": "jean@example.com",
        "subject": "Question",
        "message": "Un message suffisamment long.",
        "website": "",
        "rendered_at": sign_rendered_at(time.time() - 30),
    }
    data.update(overrides)
    return data


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
        html = response.content.decode()
        self.assertIn('name="website"', html)
        self.assertIn('autocomplete="off"', html)
        self.assertIn('tabindex="-1"', html)
        self.assertIn('aria-hidden="true"', html)
        self.assertIn('name="rendered_at"', html)
        self.assertIn("contact-hp", html)

    def test_valid_submit_saves_and_sends_mail(self):
        response = self.client.post(
            reverse("contact_form:contact"),
            contact_payload(),
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
            contact_payload(name="Jean2", message="court"),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Contact.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_default_subject_when_empty(self):
        self.client.post(
            reverse("contact_form:contact"),
            contact_payload(subject=""),
        )
        contact = Contact.objects.get()
        self.assertEqual(contact.subject, "Nouveau message de contact")

    def test_success_page_ok(self):
        response = self.client.get(reverse("contact_form:success"))
        self.assertEqual(response.status_code, 200)


class ContactSpamTests(TestCase):
    def assert_silent_reject(self, payload, motif):
        with self.assertLogs("contact_form.views", level="INFO") as logs:
            response = self.client.post(reverse("contact_form:contact"), payload)
        self.assertRedirects(response, reverse("contact_form:success"))
        self.assertEqual(Contact.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)
        logged = "\n".join(logs.output)
        self.assertIn(motif, logged)
        self.assertNotIn("jean@example.com", logged)
        self.assertNotIn(payload["message"], logged)

    def test_normal_submit_accepted(self):
        response = self.client.post(
            reverse("contact_form:contact"),
            contact_payload(message="Bonjour, un seul lien https://killianp.dev merci."),
        )
        self.assertRedirects(response, reverse("contact_form:success"))
        self.assertEqual(Contact.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_honeypot_filled_rejected(self):
        self.assert_silent_reject(
            contact_payload(website="https://promo.example"),
            "honeypot",
        )

    def test_too_fast_rejected(self):
        self.assert_silent_reject(
            contact_payload(rendered_at=sign_rendered_at(time.time())),
            "trop_rapide",
        )

    def test_forged_signature_rejected(self):
        token = sign_rendered_at(time.time() - 30)
        forged = token[:-1] + ("a" if token[-1] != "a" else "b")
        self.assert_silent_reject(
            contact_payload(rendered_at=forged),
            "signature_invalide",
        )

    def test_two_links_rejected(self):
        self.assert_silent_reject(
            contact_payload(
                message="Offre https://a.example/promo et aussi https://b.example/deal"
            ),
            "liens_multiples",
        )
