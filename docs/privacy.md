# Stela — Politique de confidentialité

_Dernière mise à jour : 29 mai 2026_

Stela est une application de bureau de prise de notes Markdown. **Stela ne possède aucun
serveur et ne collecte aucune de vos données** — vos notes vivent sur _votre_ Google Drive.

## 1. Responsable du traitement
Stela est éditée par Auxance Jourdan. Contact : **auxance.jourdan@proton.me**.

## 2. Données auxquelles Stela accède
Avec votre autorisation, Stela utilise l'API Google Drive avec le périmètre **`drive.file`**.
Ce périmètre est restreint : Stela n'accède qu'aux fichiers **qu'elle a elle-même créés** :
- les notes `.md` dans le dossier « Stela Notes » de votre Drive ;
- les médias (audio des notes vocales, vidéos importées) dans le sous-dossier « Médias ».

Stela **ne voit pas** le reste de votre Drive, ni vos e-mails ou contacts.

## 3. Utilisation des données
- Uniquement pour **créer, lire, modifier et synchroniser vos notes** sur votre propre Drive.
- Les échanges se font **directement entre votre ordinateur et Google** ; rien ne transite
  par un serveur tiers ni par nous.
- Aucune collecte, aucune vente, aucun partage, aucune publicité, aucun pistage.

## 4. Authentification et stockage local
- Connexion via **OAuth 2.0 + PKCE** ; Stela ne voit jamais votre mot de passe.
- Le jeton de rafraîchissement est stocké dans le **trousseau du système d'exploitation**
  (Gestionnaire d'identifiants Windows), jamais en clair.
- Correction orthographique et animations : **100 % local, hors ligne**.

## 5. Conformité Google
L'utilisation et le transfert par Stela des informations reçues des API Google respectent la
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
y compris les exigences d'utilisation limitée (_Limited Use_).

> _Stela's use and transfer of information received from Google APIs to any other app will
> adhere to the Google API Services User Data Policy, including the Limited Use requirements._

## 6. Sécurité
Communications HTTPS avec Google ; secrets confiés au trousseau natif ; aucune base de
données distante.

## 7. Vos droits / révocation
- Déconnexion depuis les **Réglages** de Stela ;
- Révocation depuis [myaccount.google.com/permissions](https://myaccount.google.com/permissions) ;
- Suppression de vos notes directement dans Google Drive.

## 8. Conservation
Aucune donnée conservée de notre côté : tout réside sur votre Drive et votre appareil.

## 9. Enfants
Stela ne s'adresse pas aux moins de 13 ans et ne collecte pas sciemment leurs données.

## 10. Modifications
Cette politique peut évoluer ; la date en tête indique la dernière version.

## 11. Contact
**auxance.jourdan@proton.me**

---

© 2026 Auxance Jourdan — Stela, open-source sous licence MIT.
