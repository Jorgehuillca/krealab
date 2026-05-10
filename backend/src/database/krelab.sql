-- ============================================================
--  KreaLab – Sistema de Ventas | Tienda de Impresiones 3D
--  Estructura basada en el modelo Nova Salud (SENATI)
--  IGV: Opción B (18% encima del precio base)
-- ============================================================
--
--  REGLAS DE NEGOCIO IMPORTANTES:
--  • Todo producto se vende SIN base personalizada por defecto.
--  • La Base Personalizada es un AÑADIDO OPCIONAL a pedido del cliente.
--  • Material de figuras   → Resina
--  • Material de la base   → Filamento
--  • En Detalle_Ventas:
--      id_base  = NULL  → sin base personalizada
--      id_base  = 1     → con base personalizada (texto en texto_base)
-- ============================================================

CREATE DATABASE KreaLab_Final;
USE KreaLab_Final;

-- ============================================================
-- 1. ENTIDADES DE CLASIFICACIÓN
-- ============================================================

CREATE TABLE Categorias (
    id_categoria     INT          AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion      TEXT
    -- Ej: 'Figura para Coleccionistas', 'Pedido Personalizado', 'Prototipo'
);

CREATE TABLE Materiales (
    id_material     INT         AUTO_INCREMENT PRIMARY KEY,
    nombre_material VARCHAR(80) NOT NULL
    -- Ej: 'Resina' (figuras), 'Filamento' (base personalizada), 'PLA', 'ABS'
);

-- ============================================================
-- 2. BASE PERSONALIZADA
--    Es un añadido OPCIONAL que el cliente puede solicitar.
--    Tiene su propio material (Filamento) distinto al de la figura (Resina).
--    Por defecto los productos NO incluyen base.
-- ============================================================

CREATE TABLE Base_Personalizada (
    id_base          INT           AUTO_INCREMENT PRIMARY KEY,
    descripcion      VARCHAR(150)  NOT NULL DEFAULT 'Base con nombre o frase grabada',
    precio_adicional DECIMAL(10,2) NOT NULL DEFAULT 20.00,  -- SIN IGV
    id_material      INT,
    FOREIGN KEY (id_material) REFERENCES Materiales(id_material)
    -- id_material → Filamento
);

-- ============================================================
-- 3. RECURSOS HUMANOS Y ACCESO
-- ============================================================

CREATE TABLE Cargos (
    id_cargo     INT         AUTO_INCREMENT PRIMARY KEY,
    nombre_cargo VARCHAR(50) NOT NULL
    -- Ej: 'Administrador', 'Vendedor', 'Diseñador 3D'
);

CREATE TABLE Empleados (
    id_empleado INT          AUTO_INCREMENT PRIMARY KEY,
    dni         CHAR(8)      UNIQUE NOT NULL,
    nombres     VARCHAR(100) NOT NULL,
    apellidos   VARCHAR(100) NOT NULL,
    id_cargo    INT,
    FOREIGN KEY (id_cargo) REFERENCES Cargos(id_cargo)
);

CREATE TABLE Usuarios (
    id_usuario    INT          AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    id_empleado   INT          UNIQUE,
    FOREIGN KEY (id_empleado) REFERENCES Empleados(id_empleado)
);

-- ============================================================
-- 4. PRODUCTOS Y PRECIOS
--    Cada producto tiene UN precio base (sin IGV, sin base).
--    La base personalizada se agrega opcionalmente en la venta.
-- ============================================================

CREATE TABLE Productos (
    id_producto      INT           AUTO_INCREMENT PRIMARY KEY,
    nombre_comercial VARCHAR(150)  NOT NULL,
    descripcion      TEXT,
    color            VARCHAR(60),
    stock_actual     INT           NOT NULL DEFAULT 0,
    stock_minimo     INT           NOT NULL DEFAULT 3,
    id_categoria     INT,
    id_material      INT,          -- material de la FIGURA (Resina)
    FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria),
    FOREIGN KEY (id_material)  REFERENCES Materiales(id_material)
);

CREATE TABLE Productos_Precios (
    id_producto_precio INT           AUTO_INCREMENT PRIMARY KEY,
    id_producto        INT,
    precio_venta       DECIMAL(10,2) NOT NULL,  -- precio SIN IGV, SIN base
    -- Una fila por producto. La base se suma en Detalle_Ventas si el cliente la pide.
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
);

-- ============================================================
-- 5. FACTURACIÓN Y VENTAS
-- ============================================================

CREATE TABLE Tipos_Comprobantes (
    id_tipo_comprobante INT         AUTO_INCREMENT PRIMARY KEY,
    nombre_documento    VARCHAR(20) NOT NULL,   -- 'Boleta' | 'Factura'
    serie_actual        CHAR(4)     NOT NULL,   -- 'B001' | 'F001'
    correlativo_actual  INT         DEFAULT 0
);

CREATE TABLE Clientes (
    id_cliente           INT          AUTO_INCREMENT PRIMARY KEY,
    numero_documento     CHAR(11)     UNIQUE NOT NULL,  -- DNI (8 dígitos) o RUC (11 dígitos)
    nombres_razon_social VARCHAR(150) NOT NULL,
    direccion            VARCHAR(200),
    telefono             VARCHAR(15)
);

CREATE TABLE Ventas (
    id_venta            INT           AUTO_INCREMENT PRIMARY KEY,
    id_tipo_comprobante INT,
    serie_documento     CHAR(4)       NOT NULL,        -- Ej: B001
    numero_documento    VARCHAR(10)   NOT NULL,        -- Ej: 00000001
    fecha_hora          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    id_cliente          INT,
    id_usuario          INT,
    op_gravadas         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    op_inafectas        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    op_exoneradas       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    subtotal            DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- sin IGV
    igv                 DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- 18%
    total               DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- con IGV
    FOREIGN KEY (id_tipo_comprobante) REFERENCES Tipos_Comprobantes(id_tipo_comprobante),
    FOREIGN KEY (id_cliente)          REFERENCES Clientes(id_cliente),
    FOREIGN KEY (id_usuario)          REFERENCES Usuarios(id_usuario)
);

CREATE TABLE Detalle_Ventas (
    id_detalle         INT           AUTO_INCREMENT PRIMARY KEY,
    id_venta           INT,
    id_producto        INT,
    id_producto_precio INT,
    -- BASE PERSONALIZADA (opcional):
    --   id_base   = NULL  → cliente NO pidió base
    --   id_base   = 1     → cliente SÍ pidió base, texto en texto_base
    id_base            INT           DEFAULT NULL,
    texto_base         VARCHAR(200)  DEFAULT NULL,     -- frase/nombre grabado en la base
    cantidad           INT           NOT NULL,
    valor              DECIMAL(10,2) NOT NULL,         -- precio figura sin IGV
    precio_base        DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- precio base sin IGV (0 si no aplica)
    subtotal           DECIMAL(10,2) NOT NULL,         -- (valor + precio_base) * cantidad, sin IGV
    igv                DECIMAL(10,2) NOT NULL,         -- subtotal * 0.18
    importe            DECIMAL(10,2) NOT NULL,         -- subtotal + igv
    FOREIGN KEY (id_venta)           REFERENCES Ventas(id_venta),
    FOREIGN KEY (id_producto)        REFERENCES Productos(id_producto),
    FOREIGN KEY (id_producto_precio) REFERENCES Productos_Precios(id_producto_precio),
    FOREIGN KEY (id_base)            REFERENCES Base_Personalizada(id_base)
);

-- ============================================================
-- DATOS INICIALES (seed)
-- ============================================================

-- Materiales
-- Resina   → material de las FIGURAS
-- Filamento → material de la BASE PERSONALIZADA
INSERT INTO Materiales (nombre_material) VALUES
    ('Resina'),       -- id 1 → figuras
    ('Filamento'),    -- id 2 → base personalizada
    ('PLA'),          -- id 3
    ('ABS');          -- id 4

-- Categorías
INSERT INTO Categorias (nombre_categoria, descripcion) VALUES
    ('Figura para Coleccionistas', 'Figuras de alta definición para coleccionistas'),  -- id 1
    ('Pedido Personalizado',       'Diseños a medida del cliente'),                    -- id 2
    ('Prototipo Funcional',        'Piezas y prototipos técnicos');                    -- id 3

-- Base Personalizada → material: Filamento (id 2)
INSERT INTO Base_Personalizada (descripcion, precio_adicional, id_material) VALUES
    ('Base con nombre o frase grabada', 20.00, 2);   -- S/.20 sin IGV → S/.23.60 con IGV

-- Tipos de comprobante
INSERT INTO Tipos_Comprobantes (nombre_documento, serie_actual, correlativo_actual) VALUES
    ('Boleta',  'B001', 0),   -- id 1
    ('Factura', 'F001', 0);   -- id 2

-- Cargos
INSERT INTO Cargos (nombre_cargo) VALUES
    ('Administrador'),   -- id 1
    ('Vendedor'),        -- id 2
    ('Diseñador 3D');    -- id 3

-- Empleados
INSERT INTO Empleados (dni, nombres, apellidos, id_cargo) VALUES
    ('72345678', 'Ana',   'Torres Rios',    2),
    ('71234567', 'Luis',  'Paredes Gomez',  2),
    ('70123456', 'María', 'Quispe Mamani',  1);

-- Usuarios
INSERT INTO Usuarios (username, password_hash, id_empleado) VALUES
    ('ana.torres',   SHA2('ana123',  256), 1),
    ('luis.paredes', SHA2('luis456', 256), 2),
    ('maria.quispe', SHA2('admin',   256), 3);

-- ============================================================
-- PRODUCTOS
-- Todos en material Resina (id 1), categoría Figura para Coleccionistas (id 1)
-- Todos sin base por defecto.
-- Precios SIN IGV. Con IGV = precio * 1.18
-- ============================================================
INSERT INTO Productos (nombre_comercial, descripcion, color, stock_actual, stock_minimo, id_categoria, id_material) VALUES
    ('Figura Tío Rico Mc Pato',
     'Figura del Tío Rico Mc Pato en resina de alta resolución. Sin base por defecto.',
     NULL,      10, 3, 1, 1),   -- id 1  | Resina

    ('Figura Mickey Mouse',
     'Figura de Mickey Mouse en resina acabado bronce. Sin base por defecto.',
     'Bronce',  8,  3, 1, 1),   -- id 2  | Resina

    ('Figura Minnie Mouse',
     'Figura de Minnie Mouse en resina color rosa. Sin base por defecto.',
     'Rosa',    6,  3, 1, 1),   -- id 3  | Resina

    ('Figura Pato Donald',
     'Figura del Pato Donald en resina. Sin base por defecto.',
     NULL,      7,  3, 1, 1),   -- id 4  | Resina

    ('Figura Goofy',
     'Figura de Goofy en resina. Sin base por defecto.',
     NULL,      5,  3, 1, 1),   -- id 5  | Resina

    ('Figura Pluto',
     'Figura de Pluto en resina color amarillo. Sin base por defecto.',
     'Amarillo', 5, 3, 1, 1),   -- id 6  | Resina

    ('Figura Baby Yoda (Grogu)',
     'Figura de Grogu (Baby Yoda) en resina. Sin base por defecto.',
     'Verde',   9,  3, 1, 1),   -- id 7  | Resina

    ('Figura Spiderman',
     'Figura de Spiderman en resina color rojo y azul. Sin base por defecto.',
     'Rojo/Azul', 8, 3, 1, 1), -- id 8  | Resina

    ('Figura Batman',
     'Figura de Batman en resina color negro. Sin base por defecto.',
     'Negro',   6,  3, 1, 1),   -- id 9  | Resina

    ('Figura Personalizada (pedido)',
     'Figura diseñada a pedido del cliente. Material y color a definir.',
     NULL,      0,  0, 2, 1);   -- id 10 | Resina | Pedido Personalizado

-- Precios SIN IGV por producto (una fila por producto)
-- Con IGV = precio_venta * 1.18
INSERT INTO Productos_Precios (id_producto, precio_venta) VALUES
    (1,  65.00),   -- Tío Rico Mc Pato    → S/.65 | con IGV: S/.76.70
    (2,  65.00),   -- Mickey Mouse        → S/.65 | con IGV: S/.76.70
    (3,  65.00),   -- Minnie Mouse        → S/.65 | con IGV: S/.76.70
    (4,  60.00),   -- Pato Donald         → S/.60 | con IGV: S/.70.80
    (5,  60.00),   -- Goofy               → S/.60 | con IGV: S/.70.80
    (6,  55.00),   -- Pluto               → S/.55 | con IGV: S/.64.90
    (7,  75.00),   -- Baby Yoda (Grogu)   → S/.75 | con IGV: S/.88.50
    (8,  70.00),   -- Spiderman           → S/.70 | con IGV: S/.82.60
    (9,  70.00),   -- Batman              → S/.70 | con IGV: S/.82.60
    (10, 0.00);    -- Personalizado (precio a cotizar)

-- Clientes de ejemplo
INSERT INTO Clientes (numero_documento, nombres_razon_social, direccion, telefono) VALUES
    ('12345678',    'Carlos Mendoza Ruiz',  'Av. Lima 123, Miraflores',  '987654321'),
    ('87654321',    'Lucía Ríos Paredes',   'Jr. Puno 456, San Borja',   '976543210'),
    ('20512345678', 'EMPRESA ABC S.A.C.',   'Calle Angamos 789, Surco',  '014567890');

-- ============================================================
-- VENTA DE EJEMPLO 1
-- Carlos compra: Tío Rico Mc Pato + Base Personalizada (con texto)
--   Figura:    S/. 65.00 sin IGV
--   Base:      S/. 20.00 sin IGV  ← cliente la pidió
--   Subtotal:  S/. 85.00 sin IGV
--   IGV 18%:   S/. 15.30
--   Total:     S/.100.30 con IGV  → Boleta
-- ============================================================
INSERT INTO Ventas (
    id_tipo_comprobante, serie_documento, numero_documento,
    id_cliente, id_usuario,
    op_gravadas, op_inafectas, op_exoneradas,
    subtotal, igv, total
) VALUES (1, 'B001', '00000001', 1, 1, 85.00, 0.00, 0.00, 85.00, 15.30, 100.30);

INSERT INTO Detalle_Ventas (
    id_venta, id_producto, id_producto_precio,
    id_base, texto_base,
    cantidad, valor, precio_base,
    subtotal, igv, importe
) VALUES (
    1, 1, 1,
    1, 'Para mi colección - Carlos',   -- ← cliente SÍ pidió base personalizada
    1, 65.00, 20.00,
    85.00, 15.30, 100.30
);

UPDATE Tipos_Comprobantes SET correlativo_actual = 1 WHERE id_tipo_comprobante = 1;

-- ============================================================
-- VENTA DE EJEMPLO 2
-- Lucía compra: Mickey Mouse sin base + Minnie Mouse sin base
--   Mickey:   S/.65.00 sin IGV  → sin base (id_base = NULL)
--   Minnie:   S/.65.00 sin IGV  → sin base (id_base = NULL)
--   Subtotal: S/.130.00 sin IGV
--   IGV 18%:  S/. 23.40
--   Total:    S/.153.40 con IGV → Boleta
-- ============================================================
INSERT INTO Ventas (
    id_tipo_comprobante, serie_documento, numero_documento,
    id_cliente, id_usuario,
    op_gravadas, op_inafectas, op_exoneradas,
    subtotal, igv, total
) VALUES (1, 'B001', '00000002', 2, 2, 130.00, 0.00, 0.00, 130.00, 23.40, 153.40);

INSERT INTO Detalle_Ventas (
    id_venta, id_producto, id_producto_precio,
    id_base, texto_base,
    cantidad, valor, precio_base,
    subtotal, igv, importe
) VALUES
    (2, 2, 2, NULL, NULL, 1, 65.00, 0.00, 65.00, 11.70,  76.70),  -- Mickey, sin base
    (2, 3, 3, NULL, NULL, 1, 65.00, 0.00, 65.00, 11.70,  76.70);  -- Minnie, sin base

UPDATE Tipos_Comprobantes SET correlativo_actual = 2 WHERE id_tipo_comprobante = 1;

-- ============================================================
-- VENTA DE EJEMPLO 3
-- Empresa ABC: Baby Yoda + Batman con base personalizada → Factura
--   Baby Yoda:  S/.75 + S/.20 base = S/.95 sin IGV
--   Batman:     S/.70 + S/.20 base = S/.90 sin IGV
--   Subtotal:   S/.185.00 sin IGV
--   IGV 18%:    S/. 33.30
--   Total:      S/.218.30 con IGV → Factura
-- ============================================================
INSERT INTO Ventas (
    id_tipo_comprobante, serie_documento, numero_documento,
    id_cliente, id_usuario,
    op_gravadas, op_inafectas, op_exoneradas,
    subtotal, igv, total
) VALUES (2, 'F001', '00000001', 3, 1, 185.00, 0.00, 0.00, 185.00, 33.30, 218.30);

INSERT INTO Detalle_Ventas (
    id_venta, id_producto, id_producto_precio,
    id_base, texto_base,
    cantidad, valor, precio_base,
    subtotal, igv, importe
) VALUES
    (3, 7, 7, 1, 'Grogu - Empresa ABC',    1, 75.00, 20.00, 95.00, 17.10, 112.10),
    (3, 9, 9, 1, 'Batman - Empresa ABC',   1, 70.00, 20.00, 90.00, 16.20, 106.20);

UPDATE Tipos_Comprobantes SET correlativo_actual = 1 WHERE id_tipo_comprobante = 2;

-- ============================================================
-- VISTA: comprobante completo con desglose de base y materiales
-- ============================================================
CREATE VIEW v_comprobante AS
SELECT
    tc.nombre_documento                              AS tipo_comprobante,
    CONCAT(v.serie_documento,'-',v.numero_documento) AS numero_comprobante,
    v.fecha_hora,
    c.numero_documento                               AS doc_cliente,
    c.nombres_razon_social                           AS cliente,
    c.direccion,
    p.nombre_comercial                               AS producto,
    cat.nombre_categoria,
    mp.nombre_material                               AS material_figura,   -- Resina
    p.color,
    -- Base personalizada (si aplica)
    CASE WHEN dv.id_base IS NOT NULL
         THEN bp.descripcion
         ELSE 'Sin base personalizada'
    END                                              AS base,
    mb.nombre_material                               AS material_base,     -- Filamento o NULL
    dv.texto_base,                                   -- frase grabada (NULL si no aplica)
    dv.cantidad,
    dv.valor                                         AS precio_figura_sin_igv,
    dv.precio_base                                   AS precio_base_sin_igv,
    dv.subtotal                                      AS subtotal_sin_igv,
    dv.igv,
    dv.importe                                       AS importe_con_igv,
    v.op_gravadas,
    v.op_inafectas,
    v.op_exoneradas,
    v.subtotal                                       AS total_sin_igv,
    v.igv                                            AS total_igv,
    v.total                                          AS total_con_igv,
    CONCAT(e.nombres,' ',e.apellidos)                AS elaborado_por,
    cr.nombre_cargo
FROM Ventas v
JOIN Detalle_Ventas      dv  ON dv.id_venta           = v.id_venta
JOIN Productos           p   ON p.id_producto          = dv.id_producto
JOIN Categorias          cat ON cat.id_categoria       = p.id_categoria
JOIN Materiales          mp  ON mp.id_material         = p.id_material
JOIN Productos_Precios   pp  ON pp.id_producto_precio  = dv.id_producto_precio
JOIN Clientes            c   ON c.id_cliente           = v.id_cliente
JOIN Tipos_Comprobantes  tc  ON tc.id_tipo_comprobante = v.id_tipo_comprobante
JOIN Usuarios            u   ON u.id_usuario           = v.id_usuario
JOIN Empleados           e   ON e.id_empleado          = u.id_empleado
JOIN Cargos              cr  ON cr.id_cargo            = e.id_cargo
LEFT JOIN Base_Personalizada bp ON bp.id_base          = dv.id_base
LEFT JOIN Materiales         mb ON mb.id_material      = bp.id_material;
