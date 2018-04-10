ClassicEditor
    .create(document.querySelector('#editor'), {
        removePlugins: ['Heading', ],
        toolbar: ['bold', 'italic', 'bulletedList', 'numberedList', 'blockQuote', 'link', 'Image', 'underline', 'strikethrough', 'code']
    })
    .catch(error => {
        console.log(error);
    });