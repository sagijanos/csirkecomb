ClassicEditor
    .create(document.querySelector('#editor'), {
        removePlugins: ['Heading', ],
        toolbar: ['bold', 'italic', 'bulletedList', 'numberedList', 'blockQuote']
    })
    .catch(error => {
        console.log(error);
    });