// ===== SISTEMA DE GESTIÓN DE TALLER - SCRIPT PRINCIPAL MEJORADO =====

// Objeto principal de la aplicación
const SistemaTaller = {
    // Configuración del sistema
    config: {
        companyName: 'DR CHAPA Y PINTURA',
        lowStockThreshold: 5,
        animations: true,
        theme: 'industrial'
    },
    
    // Estado de la aplicación
    state: {
        productos: [],
        currentSection: 'registro',
        editingProduct: null,
        searchTerm: '',
        filterCategory: '',
        selectedProducts: new Set() // Para la funcionalidad de impresión
    },
    
    // Inicialización del sistema
    init: function() {
        console.log('Inicializando Sistema de Gestión de Taller v4.0...');
        
        // Cargar configuración y datos
        this.cargarConfiguracion();
        this.cargarProductos();
        
        // Configurar eventos
        this.configurarEventos();
        
        // Inicializar interfaz
        this.inicializarInterfaz();
        
        // Mostrar sección activa
        this.mostrarSeccion(this.state.currentSection);
        
        console.log('Sistema inicializado correctamente');
    },
    
    // Cargar configuración desde localStorage
    cargarConfiguracion: function() {
        const configGuardada = localStorage.getItem('taller-config');
        if (configGuardada) {
            this.config = { ...this.config, ...JSON.parse(configGuardada) };
        }
        
        // Aplicar configuración
        this.aplicarConfiguracion();
    },
    
    // Guardar configuración en localStorage
    guardarConfiguracion: function() {
        localStorage.setItem('taller-config', JSON.stringify(this.config));
    },
    
    // Aplicar configuración a la interfaz
    aplicarConfiguracion: function() {
        // Aplicar nombre de empresa
        if (document.getElementById('company-name')) {
            document.getElementById('company-name').value = this.config.companyName;
        }
        
        // Aplicar umbral de stock bajo
        if (document.getElementById('low-stock-threshold')) {
            document.getElementById('low-stock-threshold').value = this.config.lowStockThreshold;
        }
        
        // Aplicar tema
        if (document.getElementById('theme')) {
            document.getElementById('theme').value = this.config.theme;
        }
        
        // Aplicar animaciones
        if (document.getElementById('animations')) {
            document.getElementById('animations').checked = this.config.animations;
        }
        
        // Aplicar tema visual
        this.aplicarTema(this.config.theme);
    },
    
    // Aplicar tema visual
    aplicarTema: function(tema) {
        document.body.className = '';
        if (tema !== 'industrial') {
            document.body.classList.add(`tema-${tema}`);
        }
    },
    
    // Cargar productos desde localStorage
    cargarProductos: function() {
        const productosGuardados = localStorage.getItem('taller-productos');
        if (productosGuardados) {
            try {
                this.state.productos = JSON.parse(productosGuardados);
            } catch (error) {
                console.error('Error al cargar productos:', error);
                this.state.productos = [];
            }
        }
    },
    
    // Guardar productos en localStorage
    guardarProductos: function() {
        localStorage.setItem('taller-productos', JSON.stringify(this.state.productos));
    },
    
    // Configurar eventos de la interfaz
    configurarEventos: function() {
        // Navegación entre secciones
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href').substring(1);
                this.mostrarSeccion(target);
                
                // Cerrar menú móvil si está abierto
                this.cerrarMenuMovil();
            });
        });
        
        // Formulario de registro de productos
        const formProducto = document.getElementById('form-producto');
        if (formProducto) {
            formProducto.addEventListener('submit', (e) => {
                e.preventDefault();
                this.registrarProducto();
            });
            
            // Validación en tiempo real del nombre
            const nombreInput = document.getElementById('nombre');
            if (nombreInput) {
                nombreInput.addEventListener('input', () => {
                    this.validarNombreProducto(nombreInput.value);
                });
            }
            
            // Establecer fecha actual por defecto
            const fechaInput = document.getElementById('fecha');
            if (fechaInput && !fechaInput.value) {
                fechaInput.value = new Date().toISOString().split('T')[0];
            }
        }
        
        // Formulario de configuración
        const formConfiguracion = document.getElementById('form-configuracion');
        if (formConfiguracion) {
            formConfiguracion.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarConfiguracionDesdeFormulario();
            });
        }
        
        // Controles de inventario
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchTerm = e.target.value.toLowerCase();
                this.filtrarInventario();
            });
        }
        
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.filtrarInventario();
            });
        }
        
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.limpiarFiltros();
            });
        }
        
        // Botones de exportación e importación
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportarDatos();
            });
        }
        
        const importBtn = document.getElementById('import-data');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                document.getElementById('import-file').click();
            });
        }
        
        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                this.importarDatos(e);
            });
        }
        
        // Modal
        const modal = document.getElementById('modal');
        const closeModal = document.querySelector('.close-modal');
        const modalCancel = document.getElementById('modal-cancel');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.cerrarModal();
            });
        }
        
        if (modalCancel) {
            modalCancel.addEventListener('click', () => {
                this.cerrarModal();
            });
        }
        
        // Cerrar modal al hacer clic fuera
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.cerrarModal();
                }
            });
        }
        
        // Evento para tecla Enter en búsqueda
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.filtrarInventario();
                }
            });
        }
        
        // Configurar autocompletado para nombre de producto
        this.configurarAutocompletado();
        
        // Configurar funcionalidad de impresión
        this.configurarImpresion();
    },
    
    // ===== FUNCIONALIDAD DE AUTOCOMPLETADO MEJORADA =====
    configurarAutocompletado: function() {
        const nombreInput = document.getElementById('nombre');
        if (!nombreInput) return;
        
        // Crear contenedor para sugerencias
        const sugerenciasContainer = document.createElement('div');
        sugerenciasContainer.className = 'sugerencias-autocompletado';
        sugerenciasContainer.id = 'sugerencias-nombre';
        nombreInput.parentNode.appendChild(sugerenciasContainer);
        
        // Evento de entrada de texto
        nombreInput.addEventListener('input', (e) => {
            const valor = e.target.value.toLowerCase().trim();
            this.mostrarSugerencias(valor, sugerenciasContainer);
        });
        
        // Evento de foco
        nombreInput.addEventListener('focus', (e) => {
            const valor = e.target.value.toLowerCase().trim();
            if (valor.length > 0) {
                this.mostrarSugerencias(valor, sugerenciasContainer);
            }
        });
        
        // Ocultar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (e.target !== nombreInput && !sugerenciasContainer.contains(e.target)) {
                sugerenciasContainer.style.display = 'none';
            }
        });
        
        // Manejar teclas especiales
        nombreInput.addEventListener('keydown', (e) => {
            const sugerenciasVisibles = sugerenciasContainer.style.display === 'block';
            const itemsSugerencia = sugerenciasContainer.querySelectorAll('.sugerencia-item');
            
            if (e.key === 'ArrowDown' && sugerenciasVisibles && itemsSugerencia.length > 0) {
                e.preventDefault();
                itemsSugerencia[0].focus();
            }
        });
    },

    mostrarSugerencias: function(valor, contenedor) {
        // Limpiar sugerencias anteriores
        contenedor.innerHTML = '';
        
        if (valor.length === 0) {
            contenedor.style.display = 'none';
            return;
        }
        
        // Obtener nombres únicos de productos (excluyendo el que se está editando)
        const nombresUnicos = [...new Set(
            this.state.productos
                .filter(producto => 
                    !this.state.editingProduct || producto.id !== this.state.editingProduct
                )
                .map(producto => producto.nombre)
        )];
        
        // Filtrar nombres que coincidan
        const sugerencias = nombresUnicos.filter(nombre => 
            nombre.toLowerCase().includes(valor)
        ).slice(0, 8); // Limitar a 8 sugerencias
        
        if (sugerencias.length === 0) {
            contenedor.style.display = 'none';
            return;
        }
        
        // Crear elementos de sugerencia
        sugerencias.forEach(sugerencia => {
            const item = document.createElement('div');
            item.className = 'sugerencia-item';
            item.textContent = sugerencia;
            item.tabIndex = 0; // Hacerlo enfocable
            
            // Resaltar la parte que coincide
            const indiceCoincidencia = sugerencia.toLowerCase().indexOf(valor);
            if (indiceCoincidencia >= 0) {
                const antes = sugerencia.substring(0, indiceCoincidencia);
                const coincidencia = sugerencia.substring(indiceCoincidencia, indiceCoincidencia + valor.length);
                const despues = sugerencia.substring(indiceCoincidencia + valor.length);
                
                item.innerHTML = `${antes}<strong>${coincidencia}</strong>${despues}`;
            }
            
            // Eventos del item
            item.addEventListener('click', () => {
                this.seleccionarSugerencia(sugerencia);
                contenedor.style.display = 'none';
            });
            
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.seleccionarSugerencia(sugerencia);
                    contenedor.style.display = 'none';
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const siguiente = item.nextElementSibling;
                    if (siguiente) siguiente.focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const anterior = item.previousElementSibling;
                    if (anterior) {
                        anterior.focus();
                    } else {
                        document.getElementById('nombre').focus();
                    }
                } else if (e.key === 'Escape') {
                    contenedor.style.display = 'none';
                    document.getElementById('nombre').focus();
                }
            });
            
            contenedor.appendChild(item);
        });
        
        contenedor.style.display = 'block';
    },

    seleccionarSugerencia: function(nombre) {
        const nombreInput = document.getElementById('nombre');
        nombreInput.value = nombre;
        
        // Disparar evento input para activar validación
        const event = new Event('input', { bubbles: true });
        nombreInput.dispatchEvent(event);
        
        // Enfocar siguiente campo si es posible
        const cantidadInput = document.getElementById('cantidad');
        if (cantidadInput) {
            cantidadInput.focus();
        }
    },
    
    // ===== FUNCIONALIDAD DE IMPRESIÓN =====
    configurarImpresion: function() {
        // Botón de imprimir seleccionados
        const printBtn = document.getElementById('print-selected');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.mostrarVistaImpresion();
            });
        }
        
        // Botones de la vista de impresión
        const printClose = document.getElementById('print-close');
        if (printClose) {
            printClose.addEventListener('click', () => {
                this.cerrarVistaImpresion();
            });
        }
        
        const printSave = document.getElementById('print-save');
        if (printSave) {
            printSave.addEventListener('click', () => {
                this.guardarComoPDF();
            });
        }
        
        const printSend = document.getElementById('print-send');
        if (printSend) {
            printSend.addEventListener('click', () => {
                this.imprimirDocumento();
            });
        }
        
        // Seleccionar todos los productos
        const selectAll = document.getElementById('select-all');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                this.seleccionarTodosProductos(e.target.checked);
            });
        }
    },
    
    seleccionarProducto: function(id, checked) {
        if (checked) {
            this.state.selectedProducts.add(id);
        } else {
            this.state.selectedProducts.delete(id);
        }
        
        // Actualizar estado del checkbox "Seleccionar todos"
        this.actualizarSeleccionTodos();
    },
    
    seleccionarTodosProductos: function(checked) {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        
        if (checked) {
            // Agregar todos los IDs visibles al conjunto
            this.state.selectedProducts.clear();
            checkboxes.forEach(checkbox => {
                const id = checkbox.dataset.id;
                this.state.selectedProducts.add(id);
                checkbox.checked = true;
            });
        } else {
            // Limpiar todos los seleccionados
            this.state.selectedProducts.clear();
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        }
    },
    
    actualizarSeleccionTodos: function() {
        const selectAll = document.getElementById('select-all');
        if (!selectAll) return;
        
        const checkboxes = document.querySelectorAll('.product-checkbox');
        const checkedCount = document.querySelectorAll('.product-checkbox:checked').length;
        
        if (checkedCount === 0) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        } else if (checkedCount === checkboxes.length) {
            selectAll.checked = true;
            selectAll.indeterminate = false;
        } else {
            selectAll.checked = false;
            selectAll.indeterminate = true;
        }
    },
    
    mostrarVistaImpresion: function() {
        if (this.state.selectedProducts.size === 0) {
            this.mostrarNotificacion('Selecciona al menos un producto para imprimir', 'warning');
            return;
        }
        
        const printView = document.getElementById('print-view');
        const printBody = document.getElementById('print-body');
        const printDate = document.getElementById('print-date');
        const printTotal = document.getElementById('print-total');
        
        if (!printView || !printBody) return;
        
        // Limpiar tabla de impresión
        printBody.innerHTML = '';
        
        // Obtener productos seleccionados
        const productosSeleccionados = this.state.productos.filter(
            producto => this.state.selectedProducts.has(producto.id)
        );
        
        // Llenar tabla de impresión
        productosSeleccionados.forEach(producto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${this.escapeHtml(producto.nombre)}</td>
                <td>${producto.cantidad}</td>
                <td>${this.obtenerNombreUnidad(producto.unidad)}</td>
                <td>${this.obtenerNombreCondicion(producto.condicion)}</td>
            `;
            printBody.appendChild(tr);
        });
        
        // Actualizar información
        printDate.textContent = new Date().toLocaleDateString('es-ES');
        printTotal.textContent = productosSeleccionados.length;
        
        // Mostrar vista de impresión
        printView.classList.add('active');
    },
    
    cerrarVistaImpresion: function() {
        const printView = document.getElementById('print-view');
        if (printView) {
            printView.classList.remove('active');
        }
    },
    
    guardarComoPDF: function() {
        // En un entorno real, aquí se implementaría la generación de PDF
        // Por ahora, simulamos la funcionalidad
        this.mostrarNotificacion('Funcionalidad de guardar como PDF disponible en versión completa', 'info');
    },
    
    imprimirDocumento: function() {
        window.print();
    },
    
    // Cerrar menú móvil (para futuras implementaciones)
    cerrarMenuMovil: function() {
        // Esta función puede expandirse para dispositivos móviles
    },
    
    // Inicializar interfaz
    inicializarInterfaz: function() {
        // Cargar inventario
        this.cargarInventario();
    },
    
    // Mostrar sección específica
    mostrarSeccion: function(seccionId) {
        // Ocultar todas las secciones
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remover activo de todos los enlaces de navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Mostrar sección seleccionada
        const seccion = document.getElementById(seccionId);
        if (seccion) {
            seccion.classList.add('active');
            
            // Activar enlace de navegación correspondiente
            const navLink = document.querySelector(`.nav-link[href="#${seccionId}"]`);
            if (navLink) {
                navLink.classList.add('active');
            }
            
            // Actualizar estado
            this.state.currentSection = seccionId;
            
            // Acciones específicas por sección
            switch(seccionId) {
                case 'inventario':
                    this.cargarInventario();
                    break;
                case 'registro':
                    this.prepararFormularioRegistro();
                    break;
                case 'configuracion':
                    this.aplicarConfiguracion();
                    break;
            }
        }
    },
    
    // Preparar formulario de registro (resetear estado de edición)
    prepararFormularioRegistro: function() {
        if (this.state.editingProduct) {
            this.state.editingProduct = null;
            const submitBtn = document.querySelector('#form-producto button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Registrar Producto';
            }
            
            // Resetear validación de nombre
            const validationMessage = document.querySelector('#nombre + .validation-message');
            if (validationMessage) {
                validationMessage.textContent = '';
            }
        }
    },
    
    // Validar nombre de producto (evitar duplicados)
    validarNombreProducto: function(nombre) {
        const validationMessage = document.querySelector('#nombre + .validation-message');
        
        if (!validationMessage) return true;
        
        if (!nombre.trim()) {
            validationMessage.textContent = '';
            return false;
        }
        
        // Verificar si ya existe un producto con el mismo nombre (excluyendo el que estamos editando)
        const existe = this.state.productos.some(producto => {
            if (this.state.editingProduct && producto.id === this.state.editingProduct) {
                return false; // Excluir el producto que estamos editando
            }
            return producto.nombre.toLowerCase() === nombre.toLowerCase().trim();
        });
        
        if (existe) {
            validationMessage.textContent = '⚠️ Este producto ya está registrado en el sistema';
            validationMessage.style.color = '#dc3545';
            return false;
        } else {
            validationMessage.textContent = '✓ Nombre disponible';
            validationMessage.style.color = '#28a745';
            return true;
        }
    },
    
    // Registrar nuevo producto o actualizar existente
    registrarProducto: function() {
        const form = document.getElementById('form-producto');
        const formData = new FormData(form);
        
        // Validar nombre
        const nombre = formData.get('nombre').trim();
        if (!nombre) {
            this.mostrarNotificacion('Error: El nombre del producto es obligatorio', 'error');
            return;
        }
        
        if (!this.validarNombreProducto(nombre)) {
            this.mostrarNotificacion('Error: Este producto ya está registrado', 'error');
            return;
        }
        
        // Crear objeto producto
        const producto = {
            id: this.state.editingProduct || Date.now().toString(),
            nombre: nombre,
            cantidad: parseInt(formData.get('cantidad')),
            unidad: formData.get('unidad'),
            descripcion: formData.get('descripcion'),
            fecha: formData.get('fecha') || new Date().toISOString().split('T')[0],
            condicion: formData.get('condicion'),
            notas: formData.get('notas'),
            fechaRegistro: new Date().toISOString()
        };
        
        // Si estamos editando, actualizar el producto existente
        if (this.state.editingProduct) {
            const index = this.state.productos.findIndex(p => p.id === this.state.editingProduct);
            if (index !== -1) {
                this.state.productos[index] = producto;
                this.mostrarNotificacion(`Producto "${producto.nombre}" actualizado correctamente`, 'success');
            }
        } else {
            // Agregar nuevo producto
            this.state.productos.push(producto);
            
            // Mostrar sello de registro
            if (this.config.animations) {
                this.mostrarSelloRegistro();
            }
            
            this.mostrarNotificacion(`Producto "${producto.nombre}" registrado correctamente`, 'success');
        }
        
        // Guardar y actualizar
        this.guardarProductos();
        
        // Resetear formulario
        form.reset();
        
        // Restablecer fecha actual
        const fechaInput = document.getElementById('fecha');
        if (fechaInput) {
            fechaInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Limpiar estado de edición
        this.state.editingProduct = null;
        
        // Restaurar texto del botón
        const submitBtn = document.querySelector('#form-producto button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Registrar Producto';
        }
        
        // Si estamos en inventario, actualizar la tabla
        if (this.state.currentSection === 'inventario') {
            this.cargarInventario();
        }
    },
    
    // Guardar configuración desde formulario
    guardarConfiguracionDesdeFormulario: function() {
        const formData = new FormData(document.getElementById('form-configuracion'));
        
        this.config.companyName = formData.get('company-name') || 'DR CHAPA Y PINTURA';
        this.config.lowStockThreshold = parseInt(formData.get('low-stock-threshold')) || 5;
        this.config.theme = formData.get('theme') || 'industrial';
        this.config.animations = formData.get('animations') === 'on';
        
        this.guardarConfiguracion();
        this.aplicarConfiguracion();
        
        this.mostrarNotificacion('Configuración guardada correctamente', 'success');
    },
    
    // Mostrar sello de registro animado
    mostrarSelloRegistro: function() {
        const seal = document.getElementById('registration-seal');
        if (!seal) return;
        
        seal.classList.add('active');
        
        setTimeout(() => {
            seal.classList.remove('active');
        }, 2000);
    },
    
    // Cargar inventario en la tabla
    cargarInventario: function() {
        const tbody = document.getElementById('inventory-body');
        const emptyState = document.getElementById('empty-inventory');
        
        if (!tbody) return;
        
        // Limpiar tabla
        tbody.innerHTML = '';
        
        if (this.state.productos.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }
        
        // Aplicar filtros si existen
        let productosMostrar = this.state.productos;
        if (this.state.searchTerm) {
            productosMostrar = this.filtrarProductos();
        }
        
        // Llenar tabla con productos
        productosMostrar.forEach(producto => {
            const tr = document.createElement('tr');
            
            // Determinar clase según stock
            if (producto.cantidad < this.config.lowStockThreshold) {
                tr.classList.add('low-stock');
            }
            
            const isChecked = this.state.selectedProducts.has(producto.id);
            
            tr.innerHTML = `
                <td>
                    <input type="checkbox" class="product-checkbox" data-id="${producto.id}" 
                           ${isChecked ? 'checked' : ''}>
                </td>
                <td>${this.escapeHtml(producto.nombre)}</td>
                <td>${producto.cantidad}</td>
                <td>${this.obtenerNombreUnidad(producto.unidad)}</td>
                <td>${this.formatearFecha(producto.fecha)}</td>
                <td>${this.obtenerNombreCondicion(producto.condicion)}</td>
                <td class="actions">
                    <button class="btn btn-secondary btn-sm" onclick="SistemaTaller.editarProducto('${producto.id}')">
                        Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="SistemaTaller.eliminarProducto('${producto.id}')">
                        Eliminar
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Configurar eventos de los checkboxes
        document.querySelectorAll('.product-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.seleccionarProducto(e.target.dataset.id, e.target.checked);
            });
        });
        
        // Actualizar estado del checkbox "Seleccionar todos"
        this.actualizarSeleccionTodos();
        
        // Si no hay productos después de filtrar, mostrar estado vacío
        if (productosMostrar.length === 0 && emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = '<p>No se encontraron productos que coincidan con los filtros.</p>';
        }
    },
    
    // Filtrar productos según búsqueda
    filtrarProductos: function() {
        return this.state.productos.filter(producto => {
            return producto.nombre.toLowerCase().includes(this.state.searchTerm);
        });
    },
    
    // Filtrar inventario según búsqueda
    filtrarInventario: function() {
        this.cargarInventario();
    },
    
    // Limpiar filtros de búsqueda
    limpiarFiltros: function() {
        document.getElementById('search-input').value = '';
        this.state.searchTerm = '';
        this.cargarInventario();
    },
    
    // Editar producto
    editarProducto: function(id) {
        const producto = this.state.productos.find(p => p.id === id);
        if (!producto) return;
        
        // Llenar formulario con datos del producto
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('cantidad').value = producto.cantidad;
        document.getElementById('unidad').value = producto.unidad;
        document.getElementById('descripcion').value = producto.descripcion || '';
        document.getElementById('fecha').value = producto.fecha;
        document.getElementById('condicion').value = producto.condicion;
        document.getElementById('notas').value = producto.notas || '';
        
        // Cambiar a sección de registro
        this.mostrarSeccion('registro');
        
        // Marcar que estamos editando
        this.state.editingProduct = id;
        
        // Cambiar texto del botón
        const submitBtn = document.querySelector('#form-producto button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Actualizar Producto';
        }
        
        // Validar nombre (puede que sea el mismo)
        this.validarNombreProducto(producto.nombre);
        
        // Desplazar hacia el formulario
        document.getElementById('registro').scrollIntoView({ behavior: 'smooth' });
    },
    
    // Eliminar producto
    eliminarProducto: function(id) {
        const producto = this.state.productos.find(p => p.id === id);
        if (!producto) return;
        
        this.mostrarModalConfirmacion(
            'Eliminar Producto',
            `¿Estás seguro de que deseas eliminar el producto "${producto.nombre}"?`,
            () => {
                this.state.productos = this.state.productos.filter(p => p.id !== id);
                this.guardarProductos();
                this.cargarInventario();
                this.mostrarNotificacion('Producto eliminado correctamente', 'success');
            }
        );
    },
    
    // Exportar datos a JSON
    exportarDatos: function() {
        if (this.state.productos.length === 0) {
            this.mostrarNotificacion('No hay datos para exportar', 'warning');
            return;
        }
        
        const dataStr = JSON.stringify({
            productos: this.state.productos,
            config: this.config,
            exportDate: new Date().toISOString()
        }, null, 2);
        
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `respaldo-taller-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        this.mostrarNotificacion('Datos exportados correctamente', 'success');
    },
    
    // Importar datos desde JSON
    importarDatos: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                this.mostrarModalConfirmacion(
                    'Importar Datos',
                    '¿Estás seguro de que deseas importar estos datos? Los productos existentes serán reemplazados.',
                    () => {
                        if (data.productos) {
                            this.state.productos = data.productos;
                            this.guardarProductos();
                        }
                        
                        if (data.config) {
                            this.config = { ...this.config, ...data.config };
                            this.guardarConfiguracion();
                            this.aplicarConfiguracion();
                        }
                        
                        this.cargarInventario();
                        this.mostrarNotificacion('Datos importados correctamente', 'success');
                        
                        // Limpiar input de archivo
                        event.target.value = '';
                    }
                );
            } catch (error) {
                this.mostrarNotificacion('Error al importar datos: archivo inválido', 'error');
                console.error('Error al importar datos:', error);
            }
        };
        
        reader.readAsText(file);
    },
    
    // Mostrar modal de confirmación
    mostrarModalConfirmacion: function(titulo, mensaje, onConfirm) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalConfirm = document.getElementById('modal-confirm');
        
        if (!modal || !modalTitle || !modalMessage || !modalConfirm) return;
        
        modalTitle.textContent = titulo;
        modalMessage.textContent = mensaje;
        
        // Configurar acción de confirmación
        modalConfirm.onclick = () => {
            onConfirm();
            this.cerrarModal();
        };
        
        // Mostrar modal
        modal.classList.add('active');
    },
    
    // Cerrar modal
    cerrarModal: function() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
        }
    },
    
    // Mostrar notificación
    mostrarNotificacion: function(mensaje, tipo = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        if (!notification || !notificationText) return;
        
        notificationText.textContent = mensaje;
        notification.className = `notification ${tipo}`;
        
        // Forzar reflow para reiniciar animación
        void notification.offsetWidth;
        
        notification.classList.add('active');
        
        setTimeout(() => {
            notification.classList.remove('active');
        }, 3000);
    },
    
    // ===== FUNCIONES AUXILIARES =====
    
    // Obtener nombre legible de unidad
    obtenerNombreUnidad: function(codigo) {
        const unidades = {
            'unidad': 'Unidad',
            'litro': 'Litro',
            'kg': 'Kilogramo',
            'metro': 'Metro'
        };
        
        return unidades[codigo] || codigo;
    },
    
    // Obtener nombre legible de condición
    obtenerNombreCondicion: function(codigo) {
        const condiciones = {
            'nuevo': 'Nuevo',
            'usado': 'Usado',
            'reparado': 'Reparado'
        };
        
        return condiciones[codigo] || codigo;
    },
    
    // Formatear fecha
    formatearFecha: function(fechaISO) {
        if (!fechaISO) return 'N/A';
        
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString('es-ES');
    },
    
    // Escapar HTML para prevenir XSS
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Inicializar sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    SistemaTaller.init();
});

// Exponer objeto global para acceso desde la consola (solo desarrollo)
window.SistemaTaller = SistemaTaller;
