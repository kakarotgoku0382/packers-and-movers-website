// =================================================================
//  JavaScript for Packer & Movers Website (app.js) - FINAL VERSION
// =================================================================

// Import functions from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Import your secret keys from the other file
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase using your config
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Main Router: Runs the correct code based on the current page ---
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split("/").pop();

    if (page === 'contact.html' || page === 'index.html') handleContactPage();
    if (page === 'services.html') handleServiceEnquiryPage();
    if (page === 'reviews.html') handleReviewsPage();
    if (page === 'blog.html') handleBlogPage();
    if (page === 'admin.html') handleAdminPage();
    if (page === 'track.html') handleTrackingPage();
});

// --- Helper function to generate a unique tracking ID ---
function generateTrackingId() {
    const prefix = "EM"; // Elephant Movers
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomNumber}`;
}

// =================================================================
//  Enquiry Submission Logic (Handles all forms)
// =================================================================
async function submitEnquiry(enquiryData, formElement) {
    const trackingId = generateTrackingId();
    const dataToSave = {
        ...enquiryData,
        trackingId: trackingId,
        status: "Booking Confirmed", // Initial status
        timestamp: new Date()
    };

    try {
        await addDoc(collection(db, "enquiries"), dataToSave);
        alert(`Success! Your enquiry has been sent.\nYour Tracking ID is: ${trackingId}\nPlease save it for future reference.`);
        formElement.reset(); // Reset the form that was submitted
    } catch (error) {
        console.error("Error sending enquiry: ", error);
        alert('Error: Could not send enquiry.');
    }
}

function handleContactPage() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const enquiryData = {
                name: contactForm.name.value,
                email: contactForm.email.value,
                phone: contactForm.phone.value,
                message: contactForm.message.value,
                type: "Simple Enquiry"
            };
            submitEnquiry(enquiryData, contactForm);
        });
    }
}

function handleServiceEnquiryPage() {
    const serviceForm = document.getElementById('service-enquiry-form');
    if (serviceForm) {
        serviceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const enquiryData = {
                name: serviceForm.fullName.value,
                email: serviceForm.email.value,
                phone: serviceForm.phone.value,
                movingFrom: serviceForm.movingFrom.value,
                movingTo: serviceForm.movingTo.value,
                movingDate: serviceForm.movingDate.value,
                details: serviceForm.details.value,
                type: "Detailed Quote Request"
            };
            submitEnquiry(enquiryData, serviceForm);
        });
    }
}

// =================================================================
//  Tracking Page Logic (track.html)
// =================================================================
function handleTrackingPage() {
    const trackingForm = document.getElementById('tracking-form');
    const resultsContainer = document.getElementById('tracking-results-container');

    if (trackingForm) {
        trackingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const trackingId = document.getElementById('trackingIdInput').value.trim();
            if (!trackingId) return;

            resultsContainer.innerHTML = `<p>Searching...</p>`;
            const q = query(collection(db, "enquiries"), where("trackingId", "==", trackingId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                resultsContainer.innerHTML = `<p style="color: red;">No shipment found with this Tracking ID.</p>`;
            } else {
                let resultHTML = '';
                querySnapshot.forEach((doc) => {
                    const shipment = doc.data();
                    resultHTML += `
                        <h4>Shipment Status</h4>
                        <p><strong>Tracking ID:</strong> ${shipment.trackingId}</p>
                        <p><strong>Current Status:</strong> <span style="font-weight: bold; color: green;">${shipment.status}</span></p>
                    `;
                });
                resultsContainer.innerHTML = resultHTML;
            }
        });
    }
}

// =================================================================
//  Reviews Page Logic (reviews.html)
// =================================================================
function handleReviewsPage() {
    const reviewForm = document.getElementById('review-form');
    const reviewsContainer = document.getElementById('reviews-container');

    async function displayReviews() {
        if (!reviewsContainer) return;
        reviewsContainer.innerHTML = 'Loading reviews...';
        let reviewsHTML = '';
        const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            reviewsContainer.innerHTML = '<p>No reviews yet. Be the first!</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
            const review = doc.data();
            reviewsHTML += `<div class="review-card"><h4>${review.name}</h4><p>"${review.review}"</p></div>`;
        });
        reviewsContainer.innerHTML = reviewsHTML;
    }

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await addDoc(collection(db, "reviews"), {
                    name: document.getElementById('customerName').value,
                    review: document.getElementById('reviewText').value,
                    timestamp: new Date()
                });
                alert('Thank you for your review!');
                reviewForm.reset();
                displayReviews();
            } catch (error) {
                alert('Error submitting review.');
            }
        });
    }

    displayReviews();
}

// =================================================================
//  Blog Page Logic (blog.html)
// =================================================================
async function handleBlogPage() {
    const blogPostsContainer = document.getElementById('blog-posts-container');
    if (!blogPostsContainer) return;

    blogPostsContainer.innerHTML = 'Loading posts...';
    let postsHTML = '';
    const q = query(collection(db, "blogs"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        blogPostsContainer.innerHTML = '<p>No blog posts yet.</p>';
        return;
    }
    querySnapshot.forEach((doc) => {
        const post = doc.data();
        postsHTML += `<div class="blog-post" style="padding: 1rem; border-bottom: 1px solid #eee;"><h2>${post.title}</h2><p>${post.content.replace(/\n/g, '<br>')}</p></div>`;
    });
    blogPostsContainer.innerHTML = postsHTML;
}

// =================================================================
//  Admin Panel Logic (admin.html)
// =================================================================
function handleAdminPage() {
    const addBlogForm = document.getElementById('add-blog-form');
    const enquiriesList = document.getElementById('enquiries-list');
    const reviewsList = document.getElementById('reviews-list');
    const blogsList = document.getElementById('blogs-list');
    const blogCountEl = document.getElementById('blog-count');
    const enquiryCountEl = document.getElementById('enquiry-count');
    const reviewCountEl = document.getElementById('review-count');

    // --- Function to add a new blog post ---
    if (addBlogForm) {
        addBlogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await addDoc(collection(db, "blogs"), {
                    title: addBlogForm.title.value,
                    content: addBlogForm.content.value,
                    timestamp: new Date()
                });
                alert('Blog post added!');
                addBlogForm.reset();
                displayAdminBlogs();
                updateStats();
            } catch (error) {
                alert('Error adding blog post.');
            }
        });
    }

    // --- Function to display all enquiries with delete button ---
    async function displayEnquiries() {
        if (!enquiriesList) return;
        enquiriesList.innerHTML = 'Loading enquiries...';
        let enquiriesHTML = '';
        const q = query(collection(db, "enquiries"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const enquiry = doc.data();
            const docId = doc.id;
            enquiriesHTML += `
                <div class="list-item" style="border: 1px solid #ccc; padding: 15px; margin-bottom: 15px;">
                    <p><strong>Tracking ID:</strong> ${enquiry.trackingId}</p>
                    <p><strong>Name:</strong> ${enquiry.name || enquiry.fullName}</p>
                    <p><strong>Current Status:</strong> ${enquiry.status}</p>
                    <div class="update-form-container" style="margin-top: 10px;">
                        <input type="text" id="status-input-${docId}" placeholder="Enter new status">
                        <button class="update-status-btn" data-id="${docId}">Update Status</button>
                        <button class="delete-btn" data-collection="enquiries" data-id="${docId}">Delete</button>
                    </div>
                </div>
            `;
        });
        enquiriesList.innerHTML = enquiriesHTML || '<p>No enquiries received yet.</p>';
    }

    // --- Function to display all reviews with delete button ---
    async function displayAdminReviews() {
        if (!reviewsList) return;
        reviewsList.innerHTML = 'Loading reviews...';
        let reviewsHTML = '';
        const q = query(collection(db, "reviews"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const review = doc.data();
            const docId = doc.id;
            reviewsHTML += `
                <div class="list-item" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
                    <p><strong>${review.name}:</strong> "${review.review}"</p>
                    <button class="delete-btn" data-collection="reviews" data-id="${docId}">Delete</button>
                </div>`;
        });
        reviewsList.innerHTML = reviewsHTML || '<p>No reviews submitted yet.</p>';
    }
    
    // --- Function to display all blogs with delete button ---
    async function displayAdminBlogs() {
        if (!blogsList) return;
        blogsList.innerHTML = 'Loading blogs...';
        let blogsHTML = '';
        const q = query(collection(db, "blogs"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const blog = doc.data();
            const docId = doc.id;
            blogsHTML += `
                <div class="list-item" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
                    <p><strong>Title:</strong> ${blog.title}</p>
                    <button class="delete-btn" data-collection="blogs" data-id="${docId}">Delete</button>
                </div>`;
        });
        blogsList.innerHTML = blogsHTML || '<p>No blogs posted yet.</p>';
    }

    // --- Function to update the stat cards ---
    async function updateStats() {
        try {
            const blogsSnapshot = await getDocs(collection(db, "blogs"));
            const enquiriesSnapshot = await getDocs(collection(db, "enquiries"));
            const reviewsSnapshot = await getDocs(collection(db, "reviews"));

            if (blogCountEl) blogCountEl.textContent = blogsSnapshot.size;
            if (enquiryCountEl) enquiryCountEl.textContent = enquiriesSnapshot.size;
            if (reviewCountEl) reviewCountEl.textContent = reviewsSnapshot.size;
        } catch (error) {
            console.error("Error updating stats: ", error);
        }
    }

    // --- Main event listener for all delete and update buttons ---
    document.querySelector('.admin-main').addEventListener('click', async (e) => {
        // Handle status updates
        if (e.target.classList.contains('update-status-btn')) {
            const docId = e.target.dataset.id;
            const newStatus = document.getElementById(`status-input-${docId}`).value;
            if (newStatus && docId) {
                await updateDoc(doc(db, "enquiries", docId), { status: newStatus });
                alert('Status updated!');
                displayEnquiries(); // Refresh list
            }
        }

        // Handle deletions
        if (e.target.classList.contains('delete-btn')) {
            const docId = e.target.dataset.id;
            const collectionName = e.target.dataset.collection;
            // The confirm() dialog is removed to prevent issues.
            // To re-enable it, wrap the below code in: if (confirm('Are you sure?')) { ... }
            try {
                await deleteDoc(doc(db, collectionName, docId));
                alert('Item deleted successfully!');
                
                // Refresh the correct list and update stats
                if (collectionName === 'enquiries') displayEnquiries();
                if (collectionName === 'reviews') displayAdminReviews();
                if (collectionName === 'blogs') displayAdminBlogs();
                updateStats();

            } catch (error) {
                console.error("Error deleting document: ", error);
                alert('Error: Could not delete item.');
            }
        }
    });

    // Load all data for the admin panel
    displayEnquiries();
    displayAdminReviews();
    displayAdminBlogs();
    updateStats();
}
