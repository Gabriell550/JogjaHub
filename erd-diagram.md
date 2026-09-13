# ERD - Sistem Direktori & Booking Layanan Multi-Tenant

```mermaid
erDiagram
    USERS ||--o{ TENANT_PROFILES : "has"
    USERS ||--o{ CHATBOT_CONVERSATIONS : "starts"
    USERS ||--o{ BOOKINGS : "makes"
    USERS ||--o{ REVIEWS : "writes"

    CATEGORIES ||--o{ SUBCATEGORIES : "has"
    CATEGORIES ||--o{ TENANT_CATEGORIES : "classifies"

    TENANT_PROFILES ||--o{ TENANT_CATEGORIES : "registers"
    TENANT_PROFILES ||--o{ SERVICES : "offers"

    SUBCATEGORIES ||--o{ SERVICES : "contains"

    SERVICES ||--o{ TIME_SLOTS : "has"
    SERVICES ||--o{ BOOKINGS : "booked_for"

    TIME_SLOTS ||--o{ BOOKINGS : "reserved_in"

    BOOKINGS ||--o{ REVIEWS : "gets"

    CHATBOT_CONVERSATIONS ||--o{ CHATBOT_MESSAGES : "contains"
    FAQS ||--o{ CHATBOT_MESSAGES : "matched_by"

    USERS {
        int id PK
        string name
        string email
        string password
        string role
        string phome
        datetime created_at
    }

    CATEGORIES {
        int id PK
        string name
    }

    SUBCATEGORIES {
        int id PK
        int categories_id FK
        string name
    }

    TENANT_PROFILES {
        int id PK
        int user_id FK
        string business_name
        string description
        string address
        string location
        string whatsapp_number
        string status
        datetime created_at
    }

    TENANT_CATEGORIES {
        int id PK
        int tenant_profile_id FK
        int categories_id FK
    }

    SERVICES {
        int id PK
        int tenant_profiles_id FK
        int subcategories_id FK
        string name
        string description
        decimal price
        string photo_url
        datetime created_at
    }

    TIME_SLOTS {
        int id PK
        int services_id FK
        date slot_date
        time start_time
        time end_time
        int quota
        int booked_account
    }

    BOOKINGS {
        int id PK
        int users_id FK
        int services_id FK
        int time_slots_id FK
        string status
        string payment_proof_url
        string payment_method
        datetime created_at
    }

    REVIEWS {
        int id PK
        int bookings_id FK
        int users_id FK
        int rating
        string comment
        datetime created_at
    }

    FAQS {
        int id PK
        string question
        string answer
        string keywords
        string category
        boolean is_active
    }

    CHATBOT_CONVERSATIONS {
        int id PK
        int users_id FK
        datetime started_at
        datetime ended_at
    }

    CHATBOT_MESSAGES {
        int id PK
        int chatbot_conversations_id FK
        int faqs_id FK
        string sender_type
        string message_text
        boolean is_answered
        datetime created_at
    }
```

## Catatan Struktur

- **Domain sistem**: Direktori & booking layanan multi-tenant (marketplace jasa) dengan fitur kategori/subkategori, penjadwalan, pemesanan, ulasan, dan chatbot FAQ.
- **TENANT_CATEGORIES** adalah tabel junction (many-to-many) antara `TENANT_PROFILES` dan `CATEGORIES`.
- **CHATBOT_MESSAGES** menghubungkan percakapan dengan FAQ yang cocok — `faqs_id` kemungkinan besar nullable untuk pesan yang belum terjawab oleh FAQ (`is_answered = false`).
- **TIME_SLOTS** menyimpan kuota (`quota`) dan jumlah yang sudah dibooking (`booked_account`) untuk mengontrol ketersediaan slot.
- **BOOKINGS** menjadi penghubung utama antara `USERS`, `SERVICES`, dan `TIME_SLOTS`, sekaligus menjadi dasar untuk `REVIEWS`.
