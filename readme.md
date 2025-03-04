<p align="center">
    <img src="https://raw.githubusercontent.com/ilyasmohetna/human-vision/main/docs/cover.png" height="300" alt="Human Vision Banner">
</p>

---

# **Human Vision: Urban Driving Image Annotation System**

## **Introduction**

**Human Vision** is a web-based annotation platform designed to prioritize and rank objects in urban driving images. Built using **Angular** (frontend) and **Laravel** (backend), the system integrates **MySQL** and **MongoDB** to efficiently handle structured and unstructured data. This project aims to enhance the understanding of dynamic urban environments by providing a robust annotation system.

## **Core Functionalities**

- 🚗 **Annotation of Key Urban Objects**: Users rank segmented objects such as **cars, traffic lights, and pedestrians** by their importance.
- 🎨 **Intuitive User Interface**: Drag-and-drop ranking into predefined categories (**High, Medium, Low** importance).
- 🔐 **User Roles & Permissions**:
  - **Users** annotate images by assigning priority rankings.
  - **Admin** reviews user annotations and determines the final rankings.
- 🗄️ **Database Management**:
  - **MongoDB**: Stores polygonal annotations for objects within images.
  - **MySQL**: Manages user authentication, rankings, and admin approvals.
- 📂 **Dataset Compatibility**: Supports datasets such as **Cityscapes, BDD100K, D²-City, and Ithaca365**.

---

## **Project Structure**

```
human-vision/
│── backend/  (Laravel Application)
│   │── app/
│   │── database/
│   │── routes/
│   └── .env
│
│── frontend/ (Angular Application)
│   │── src/
│   │── angular.json
│   └── package.json
│
│── datasets/
│   │── val/
│   │── val_annotation/
│   └── metadata/
│
│── docs/ (Documentation)
│── README.md
│── LICENSE
└── .gitignore
```

---

## **Installation**

To set up the project, simply run:

```bash
docker-compose up -d
```

This command will start all required services, including the frontend, backend, and database instances.

---

## **API Endpoints**

| Method | Endpoint                      | Description                  |
| ------ | ----------------------------- | ---------------------------- |
| GET    | `/api/images`                 | Fetch images for annotation  |
| GET    | `/api/annotations/{image_id}` | Fetch objects from MongoDB   |
| POST   | `/api/rankings`               | Submit user rankings         |
| POST   | `/api/final-approval`         | Admin approves final ranking |

---

## **System Workflow**

### **User Flow**

1. **Login/Register**: Users sign in to access the annotation system.
2. **Image Display**: Users view an image with segmented objects.
3. **Drag & Drop Ranking**: Users prioritize objects by placing them in High, Medium, or Low priority categories.
4. **Save Annotation**: Rankings are stored in MySQL and linked to MongoDB annotations.

### **Admin Flow**

1. **View Annotations**: Admins review user-submitted rankings for each image.
2. **Approval Process**: Admins validate and finalize the ranking decisions.
3. **Final Decision Storage**: Approved rankings are stored in MySQL for future reference.

---

## **Contributing**

We welcome contributions! To contribute:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature-new-functionality`
3. **Commit your changes**: `git commit -m "Add new feature"`
4. **Push to branch**: `git push origin feature-new-functionality`
5. **Create a pull request**

---

## **License**

This project is licensed under the [MIT License](LICENSE).

---

## **Credits**

- **Dataset Sources**: Cityscapes, BDD100K, D²-City, Ithaca365
- **Developed By**: [Your Name/Organization]

🌟 _Empowering Human Vision for Safer Roads!_ 🚀
