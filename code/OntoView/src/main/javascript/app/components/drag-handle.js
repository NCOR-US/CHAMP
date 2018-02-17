import Component from '@ember/component';

export default Component.extend({
    attributeBindings: ['canDrag:draggable'],
    canDrag: true,

    dragStart(e) {
        let datum = this.get('data');
        e.dataTransfer.setData('text/data', datum);
        // todo drag image?
        /*
         let dragText = this.get('dragText');
         if (dragText) {
         let svg = '<svg xmlns="http://www.w3.org/2000/svg" height="30" width="200"><text x="0" y="15" fill="blue">' + dragText + '</text></svg>';
         let image = document.createElement('img');
         image.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
         e.dataTransfer.setDragImage(image, -20, -20);
         }
         */

        e.stopPropagation();
    }
});
